#!/usr/bin/env node
import { Address, StrKey } from "@stellar/stellar-sdk";
import { Command } from "commander";

import { parseDisplayAmount } from "./amounts";
import { ILNClient } from "./client";
import { loadConfig } from "./config";
import { parseDueDate } from "./dates";
import { formatUnknownError } from "./errors";
import { createUi, describeConfig, formatInvoiceDetails, formatInvoiceList } from "./format";
import { createKeypairFileSigner } from "./signer";
import { TestnetAccountSeeder } from "./dev-seed";
import { runFaucet } from "./faucet";
import { scaffoldConfig } from "./config";
import type { ResolvedConfig, RpcServerLike } from "./types";

export interface CliDependencies {
  createClient(config: ResolvedConfig): ILNClient;
  loadConfig(options?: { cwd?: string; env?: NodeJS.ProcessEnv }): ResolvedConfig;
  stderr: NodeJS.WritableStream;
  stdout: NodeJS.WritableStream;
}

export async function runCli(
  argv: string[],
  dependencies: Partial<CliDependencies> = {},
): Promise<number> {
  const stdout = dependencies.stdout ?? process.stdout;
  const stderr = dependencies.stderr ?? process.stderr;
  const ui = createUi(stdout, stderr);
  const load = dependencies.loadConfig ?? loadConfig;
  const createClient =
    dependencies.createClient ??
    ((config: ResolvedConfig) => new ILNClient({
      contractId: config.contractId,
      networkPassphrase: config.networkPassphrase,
      rpcUrl: config.rpcUrl,
      signer: createKeypairFileSigner(config.keypairPath),
    }));

  const program = new Command();
  program
    .name("iln")
    .description("Invoice Liquidity Network CLI")
    .exitOverride()
    .showHelpAfterError()
    .option("--json", "reserved for future machine-readable output")
    .hook("preAction", () => {
      try {
        const config = load();
        ui.info(`Using ${describeConfig(config)}`);
      } catch (error) {
        throw error;
      }
    });

  program
    .command("submit")
    .description("Submit a new invoice from the configured signer account.")
    .requiredOption("--payer <address>", "payer Stellar address")
    .requiredOption("--amount <amount>", "invoice amount in display units, for example 100 or 12.5")
    .requiredOption("--due <date>", "due date as YYYY-MM-DD or Unix timestamp")
    .requiredOption("--rate <bps>", "discount rate in basis points")
    .option("--token <contractId>", "override token contract ID from config")
    .action(async (options: { amount: string; due: string; payer: string; rate: string; token?: string }) => {
      const config = load();
      const client = createClient(config);
      const tokenId = options.token ?? config.tokenId;
      if (!tokenId) {
        throw new Error(
          "Missing token ID. Set `tokenId` in .iln.json, set `ILN_TOKEN_ID`, or pass `--token`.",
        );
      }

      assertStellarAddress(options.payer, "payer");
      assertContractId(tokenId, "token");

      const { invoiceId, txHash } = await client.submitInvoice({
        amount: parseDisplayAmount(options.amount),
        discountRate: parseBasisPoints(options.rate),
        dueDate: parseDueDate(options.due),
        payer: options.payer,
        tokenId,
      });

      ui.success(`Submitted invoice ${invoiceId.toString()} in transaction ${txHash}.`);
    });

  program
    .command("fund")
    .description("Fund an invoice using the configured signer account.")
    .requiredOption("--id <invoiceId>", "invoice ID")
    .option("--amount <amount>", "amount to fund in display units; defaults to the remaining balance")
    .action(async (options: { amount?: string; id: string }) => {
      const client = createClient(load());
      const result = await client.fundInvoice(
        parseInvoiceId(options.id),
        options.amount ? parseDisplayAmount(options.amount) : undefined,
      );
      ui.success(`Funded invoice ${options.id} in transaction ${result.hash}.`);
    });

  program
    .command("pay")
    .description("Mark an invoice as paid using the configured signer account.")
    .requiredOption("--id <invoiceId>", "invoice ID")
    .action(async (options: { id: string }) => {
      const client = createClient(load());
      const result = await client.markPaid(parseInvoiceId(options.id));
      ui.success(`Marked invoice ${options.id} as paid in transaction ${result.hash}.`);
    });

  program
    .command("status")
    .description("Show the current state of an invoice.")
    .requiredOption("--id <invoiceId>", "invoice ID")
    .action(async (options: { id: string }) => {
      const client = createClient(load());
      const invoice = await client.getInvoice(parseInvoiceId(options.id));
      ui.info(formatInvoiceDetails(invoice));
    });

  program
    .command("list")
    .description("List all invoices associated with a Stellar address.")
    .requiredOption("--address <address>", "freelancer, payer, or funder Stellar address")
    .action(async (options: { address: string }) => {
      assertStellarAddress(options.address, "address");
      const client = createClient(load());
      const invoices = await client.listInvoicesByAddress(options.address);
      ui.info(formatInvoiceList(invoices));
    });

  program
    .command("faucet")
    .description("Fund an address with testnet XLM, USDC, and EURC. Automatically sets up trustlines if possible.")
    .argument("[address]", "target Stellar address (defaults to configured signer)")
    .action(async (address?: string) => {
      const config = load();
      await runFaucet(config, ui, address);
    });

  const configCommand = program.command("config").description("Configuration utilities");

  configCommand
    .command("validate")
    .description("Validate the current configuration file")
    .action(() => {
      try {
        const config = load();
        ui.success(`Configuration is valid!`);
        ui.info(`Resolved config: ${describeConfig(config)}`);
      } catch (error: any) {
        ui.error(error.message);
        process.exitCode = 1;
      }
    });

  configCommand
    .command("init")
    .description("Scaffold a new .iln.config.ts file in the current directory")
    .action(() => {
      try {
        const path = scaffoldConfig(process.cwd());
        ui.success(`Successfully scaffolded template config at ${path}`);
      } catch (error: any) {
        ui.error(error.message);
        process.exitCode = 1;
      }
    });

  // Development commands
  const devCommand = program.command("dev").description("Development utilities");

  devCommand
    .command("seed")
    .description("Create and fund testnet accounts with USDC/EURC trustlines for development.")
    .action(async () => {
      const config = load();
      const seeder = new TestnetAccountSeeder({ config, ui });
      await seeder.seed();
    });

  try {
    await program.parseAsync(argv, { from: "user" });
    return 0;
  } catch (error) {
    ui.error(formatUnknownError(error));
    return 1;
  }
}

export async function main(): Promise<void> {
  const exitCode = await runCli(process.argv.slice(2));
  process.exitCode = exitCode;
}

function parseInvoiceId(value: string): bigint {
  if (!/^\d+$/.test(value)) {
    throw new Error("Invoice ID must be a positive integer.");
  }

  return BigInt(value);
}

function parseBasisPoints(value: string): number {
  if (!/^\d+$/.test(value)) {
    throw new Error("Discount rate must be an integer basis-point value.");
  }

  return Number(value);
}

function assertStellarAddress(value: string, field: string): void {
  if (!StrKey.isValidEd25519PublicKey(value)) {
    throw new Error(`Invalid ${field} address: ${value}`);
  }
}

function assertContractId(value: string, field: string): void {
  try {
    Address.fromString(value);
  } catch {
    throw new Error(`Invalid ${field} contract ID: ${value}`);
  }
}
