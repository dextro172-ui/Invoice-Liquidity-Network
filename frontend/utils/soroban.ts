import {
  xdr,
  rpc,
  Address,
  scValToNative,
  nativeToScVal,
  TransactionBuilder,
  Transaction,
  Operation,
  Account,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import {
  CONTRACT_ID,
  NETWORK_PASSPHRASE,
  RPC_URL,
  TESTNET_EURC_TOKEN_ID,
  TESTNET_USDC_TOKEN_ID,
} from "../constants";

// ─── RPC & constants ──────────────────────────────────────────────────────────

const server = new rpc.Server(RPC_URL);
const READ_ACCOUNT = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const POLL_ATTEMPTS = 20;
const ACCEPTED_SEND_STATUSES = new Set(["PENDING", "DUPLICATE"]);
const DEFAULT_TOKEN_ALLOWANCE_LEDGER_BUFFER = 20_000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Invoice {
  id: bigint;
  freelancer: string;
  payer: string;
  amount: bigint;
  due_date: bigint;
  discount_rate: number;
  status: string;
  funder?: string;
  funded_at?: bigint;
  token?: string;
}

export interface SubmittedInvoiceResult {
  invoiceId: bigint;
  txHash: string;
}

export interface TokenMetadata {
  contractId: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface PayerScoreResult {
  score: number;
  settled_on_time: number;
  defaults: number;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

const KNOWN_TOKEN_METADATA: Record<string, Omit<TokenMetadata, "contractId">> = {
  [TESTNET_USDC_TOKEN_ID]: { name: "USD Coin", symbol: "USDC", decimals: 7 },
  [TESTNET_EURC_TOKEN_ID]: { name: "Euro Coin", symbol: "EURC", decimals: 7 },
};

function buildReadTransaction(contractId: string, method: string, params: xdr.ScVal[]) {
  return new TransactionBuilder(new Account(READ_ACCOUNT, "0"), {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: contractId,
        function: method,
        args: params,
      })
    )
    .setTimeout(30)
    .build();
}

function parseStatus(status: unknown): string {
  if (status && typeof status === "object") {
    return Object.keys(status as object)[0];
  }
  return String(status);
}

function extractInvoiceIdFromTransaction(result: unknown): bigint | null {
  if (!result || typeof result !== "object") return null;

  const maybe = result as { returnValue?: unknown; resultMetaXdr?: string };

  if (maybe.returnValue instanceof xdr.ScVal) {
    return BigInt(scValToNative(maybe.returnValue));
  }

  if (typeof maybe.returnValue === "string") {
    try {
      return BigInt(scValToNative(xdr.ScVal.fromXDR(maybe.returnValue, "base64")));
    } catch {
      return null;
    }
  }

  if (maybe.resultMetaXdr) {
    try {
      const meta = xdr.TransactionMeta.fromXDR(maybe.resultMetaXdr, "base64");
      const returnValue = meta.v3()?.sorobanMeta()?.returnValue();
      if (returnValue) return BigInt(scValToNative(returnValue));
    } catch {
      return null;
    }
  }

  return null;
}

async function readTokenContractValue(tokenId: string, method: string): Promise<unknown> {
  const callResult = await server.simulateTransaction(buildReadTransaction(tokenId, method, []));
  if (!rpc.Api.isSimulationSuccess(callResult) || !callResult.result?.retval) {
    throw new Error(`Failed to fetch token ${method}.`);
  }
  return scValToNative(callResult.result.retval);
}

// ─── Read functions ───────────────────────────────────────────────────────────

export async function getInvoiceCount(): Promise<bigint> {
  const result = await server.getHealth();
  if (result.status !== "healthy") {
    throw new Error("RPC server is not healthy");
  }
  const callResult = await server.simulateTransaction(
    buildReadTransaction(CONTRACT_ID, "get_invoice_count", [])
  );
  if (rpc.Api.isSimulationSuccess(callResult)) {
    return scValToNative(callResult.result!.retval);
  }
  throw new Error("Failed to get invoice count");
}

export async function getInvoice(id: bigint): Promise<Invoice> {
  const params: xdr.ScVal[] = [nativeToScVal(id, { type: "u64" })];
  const callResult = await server.simulateTransaction(
    buildReadTransaction(CONTRACT_ID, "get_invoice", params)
  );
  if (rpc.Api.isSimulationSuccess(callResult)) {
    const native = scValToNative(callResult.result!.retval);
    return {
      id: native.id,
      freelancer: native.freelancer,
      payer: native.payer,
      amount: native.amount,
      due_date: native.due_date,
      discount_rate: native.discount_rate,
      status: parseStatus(native.status),
      funder: native.funder,
      funded_at: native.funded_at,
      token: native.token,
    };
  }
  throw new Error(`Failed to get invoice ${id}`);
}

export async function getAllInvoices(): Promise<Invoice[]> {
  const invoices: Invoice[] = [];
  let i = BigInt(1);
  let consecutiveFailures = 0;

  while (consecutiveFailures < 1) {
    try {
      invoices.push(await getInvoice(i));
      i++;
      consecutiveFailures = 0;
    } catch {
      consecutiveFailures++;
    }
    if (i > BigInt(1000)) break;
  }
  return invoices;
}

export async function getApprovedTokenIds(): Promise<string[]> {
  const callResult = await server.simulateTransaction(
    buildReadTransaction(CONTRACT_ID, "list_tokens", [])
  );
  if (!rpc.Api.isSimulationSuccess(callResult) || !callResult.result?.retval) {
    throw new Error("Failed to fetch approved tokens.");
  }
  const native = scValToNative(callResult.result.retval);
  return Array.isArray(native) ? native.map(String) : [];
}

export async function getTokenMetadata(tokenId: string): Promise<TokenMetadata> {
  const fallback = KNOWN_TOKEN_METADATA[tokenId];
  const [nameResult, symbolResult, decimalsResult] = await Promise.allSettled([
    readTokenContractValue(tokenId, "name"),
    readTokenContractValue(tokenId, "symbol"),
    readTokenContractValue(tokenId, "decimals"),
  ]);
  const name = nameResult.status === "fulfilled" ? String(nameResult.value) : fallback?.name ?? "Token";
  const symbol = symbolResult.status === "fulfilled" ? String(symbolResult.value) : fallback?.symbol ?? "TOKEN";
  const decimalsValue = decimalsResult.status === "fulfilled" ? Number(decimalsResult.value) : fallback?.decimals ?? 7;
  return {
    contractId: tokenId,
    name,
    symbol,
    decimals: Number.isFinite(decimalsValue) ? decimalsValue : 7,
  };
}

export async function getTokenBalance(
  address: string,
  tokenId = TESTNET_USDC_TOKEN_ID
): Promise<bigint> {
  const params: xdr.ScVal[] = [Address.fromString(address).toScVal()];
  const callResult = await server.simulateTransaction(
    buildReadTransaction(tokenId, "balance", params)
  );
  if (!rpc.Api.isSimulationSuccess(callResult) || !callResult.result?.retval) {
    throw new Error("Failed to fetch token balance.");
  }
  return BigInt(scValToNative(callResult.result.retval));
}

export async function getUsdcBalance(
  address: string,
  tokenId = TESTNET_USDC_TOKEN_ID
): Promise<bigint> {
  return getTokenBalance(address, tokenId);
}

export async function getTokenAllowance({
  owner,
  spender = CONTRACT_ID,
  tokenId = TESTNET_USDC_TOKEN_ID,
}: {
  owner: string;
  spender?: string;
  tokenId?: string;
}): Promise<bigint> {
  const params: xdr.ScVal[] = [
    Address.fromString(owner).toScVal(),
    Address.fromString(spender).toScVal(),
  ];
  const callResult = await server.simulateTransaction(
    buildReadTransaction(tokenId, "allowance", params)
  );
  if (!rpc.Api.isSimulationSuccess(callResult) || !callResult.result?.retval) {
    throw new Error("Failed to fetch token allowance.");
  }
  return BigInt(scValToNative(callResult.result.retval));
}

export async function getUsdcAllowance(args: {
  owner: string;
  spender?: string;
  tokenId?: string;
}): Promise<bigint> {
  return getTokenAllowance(args);
}

/** Returns the invoice amount — used to pass the correct funding amount to fund_invoice. */
async function getInvoiceRequiredFunding(invoiceId: bigint): Promise<bigint> {
  const invoice = await getInvoice(invoiceId);
  return invoice.amount;
}

export async function getPayerScore(payerAddress: string): Promise<PayerScoreResult | null> {
  try {
    const params: xdr.ScVal[] = [Address.fromString(payerAddress).toScVal()];
    const callResult = await server.simulateTransaction(
      buildReadTransaction(CONTRACT_ID, "payer_score", params)
    );
    if (!rpc.Api.isSimulationSuccess(callResult) || !callResult.result?.retval) return null;
    const native = scValToNative(callResult.result.retval);
    if (native === null || native === undefined) return null;
    return {
      score: Number(native.score ?? native),
      settled_on_time: Number(native.settled_on_time ?? 0),
      defaults: Number(native.defaults ?? 0),
    };
  } catch {
    return null;
  }
}

export async function getPayerScoresBatch(
  addresses: string[]
): Promise<Map<string, PayerScoreResult | null>> {
  const unique = [...new Set(addresses)];
  const results = await Promise.allSettled(unique.map((addr) => getPayerScore(addr)));
  const map = new Map<string, PayerScoreResult | null>();
  unique.forEach((addr, i) => {
    const result = results[i];
    map.set(addr, result.status === "fulfilled" ? result.value : null);
  });
  return map;
}

// ─── Write: fund invoice ──────────────────────────────────────────────────────

export async function fundInvoice(funder: string, invoice_id: bigint) {
  const params: xdr.ScVal[] = [
    Address.fromString(funder).toScVal(),
    nativeToScVal(invoice_id, { type: "u64" }),
    nativeToScVal(await getInvoiceRequiredFunding(invoice_id), { type: "i128" }),
  ];

  const account = await server.getAccount(funder);
  const tx = new TransactionBuilder(account, {
    fee: "10000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
          new xdr.InvokeContractArgs({
            contractAddress: Address.fromString(CONTRACT_ID).toScAddress(),
            functionName: "fund_invoice",
            args: params,
          })
        ),
        auth: [],
      })
    )
    .setTimeout(60 * 5)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulation failed: ${sim.error}`);
  }
  return rpc.assembleTransaction(tx, sim).build();
}

// ─── Write: mark paid ─────────────────────────────────────────────────────────

export async function markPaid(payer: string, invoice_id: bigint) {
  const params: xdr.ScVal[] = [nativeToScVal(invoice_id, { type: "u64" })];
  const account = await server.getAccount(payer);
  const tx = new TransactionBuilder(account, {
    fee: "10000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
          new xdr.InvokeContractArgs({
            contractAddress: Address.fromString(CONTRACT_ID).toScAddress(),
            functionName: "mark_paid",
            args: params,
          })
        ),
        auth: [],
      })
    )
    .setTimeout(60 * 5)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulation failed: ${sim.error}`);
  }
  return rpc.assembleTransaction(tx, sim).build();
}

// ─── Write: claim default ─────────────────────────────────────────────────────

export async function claimDefault(funder: string, invoice_id: bigint) {
  const params: xdr.ScVal[] = [
    Address.fromString(funder).toScVal(),
    nativeToScVal(invoice_id, { type: "u64" }),
  ];
  const account = await server.getAccount(funder);
  const tx = new TransactionBuilder(account, {
    fee: "10000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
          new xdr.InvokeContractArgs({
            contractAddress: Address.fromString(CONTRACT_ID).toScAddress(),
            functionName: "claim_default",
            args: params,
          })
        ),
        auth: [],
      })
    )
    .setTimeout(60 * 5)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulation failed: ${sim.error}`);
  }
  return rpc.assembleTransaction(tx, sim).build();
}

// ─── Write: submit invoice (returns tx for external signing) ──────────────────
// Used by the freelancer dashboard (sign via WalletContext.signTx).

export interface SubmitInvoiceArgs {
  freelancer: string;
  payer: string;
  /** Amount in stroops (1 USDC = 10_000_000) */
  amount: bigint;
  /** Unix timestamp (seconds) */
  dueDate: number;
  /** Basis-points × 100 — e.g. 500 = 5.00% */
  discountRate: number;
}

export async function submitInvoice(
  args: SubmitInvoiceArgs
): Promise<{ tx: Transaction; invoiceId: bigint }> {
  const params: xdr.ScVal[] = [
    Address.fromString(args.freelancer).toScVal(),
    Address.fromString(args.payer).toScVal(),
    nativeToScVal(args.amount, { type: "i128" }),
    nativeToScVal(BigInt(args.dueDate), { type: "u64" }),
    nativeToScVal(args.discountRate, { type: "u32" }),
  ];

  const account = await server.getAccount(args.freelancer);
  const tx = new TransactionBuilder(account, {
    fee: "10000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
          new xdr.InvokeContractArgs({
            contractAddress: Address.fromString(CONTRACT_ID).toScAddress(),
            functionName: "submit_invoice",
            args: params,
          })
        ),
        auth: [],
      })
    )
    .setTimeout(60 * 5)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulation failed: ${(sim as any).error}`);
  }

  let invoiceId = BigInt(0);
  try {
    const raw = scValToNative(sim.result!.retval);
    if (raw && typeof raw === "object" && "ok" in raw) {
      invoiceId = BigInt((raw as any).ok);
    } else if (raw && typeof raw === "object" && "Ok" in raw) {
      invoiceId = BigInt((raw as any).Ok);
    } else {
      invoiceId = BigInt(raw as any);
    }
  } catch {
    // Proceed without ID — it will be confirmed after polling
  }

  const finalTx = rpc.assembleTransaction(tx, sim).build();
  return { tx: finalTx as unknown as Transaction, invoiceId };
}

// ─── Write: submit invoice (full sign-and-send, self-contained) ───────────────
// Used when the caller provides a signTx callback (e.g. SDK-style integration).

export async function submitInvoiceTransaction({
  freelancer,
  payer,
  amount,
  dueDate,
  discountRate,
  signTx,
  token = TESTNET_USDC_TOKEN_ID,
}: {
  freelancer: string;
  payer: string;
  amount: bigint;
  dueDate: number;
  discountRate: number;
  signTx: (txXdr: string) => Promise<string>;
  token?: string;
}): Promise<SubmittedInvoiceResult> {
  const sourceAccount = await server.getAccount(freelancer);
  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: CONTRACT_ID,
        function: "submit_invoice",
        args: [
          Address.fromString(freelancer).toScVal(),
          Address.fromString(payer).toScVal(),
          nativeToScVal(amount, { type: "i128" }),
          nativeToScVal(dueDate, { type: "u64" }),
          nativeToScVal(discountRate, { type: "u32" }),
          Address.fromString(token).toScVal(),
        ],
      })
    )
    .setTimeout(60)
    .build();

  const simulated = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(simulated) || !simulated.result?.retval) {
    const message =
      "error" in simulated ? simulated.error : "Unable to simulate invoice submission.";
    throw new Error(`Simulation failed: ${message}`);
  }

  const simulatedInvoiceId = BigInt(scValToNative(simulated.result.retval));
  const prepared = await server.prepareTransaction(tx);
  const signedXdr = await signTx(prepared.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE) as Transaction;
  const sent = await server.sendTransaction(signedTx);

  if (!sent.hash || !sent.status) {
    throw new Error("RPC server returned an invalid response for invoice submission.");
  }
  if (!ACCEPTED_SEND_STATUSES.has(sent.status)) {
    throw new Error(`Transaction submission failed with status ${sent.status}.`);
  }

  const finalResult = await server.pollTransaction(sent.hash, { attempts: POLL_ATTEMPTS });
  if (finalResult.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction failed with status ${String(finalResult.status)}.`);
  }

  return {
    invoiceId: extractInvoiceIdFromTransaction(finalResult) ?? simulatedInvoiceId,
    txHash: sent.hash,
  };
}

// ─── Write: token approve ─────────────────────────────────────────────────────

export async function buildApproveTokenTransaction({
  owner,
  amount,
  spender = CONTRACT_ID,
  tokenId = TESTNET_USDC_TOKEN_ID,
}: {
  owner: string;
  amount: bigint;
  spender?: string;
  tokenId?: string;
}) {
  const account = await server.getAccount(owner);
  const latestLedger = await server.getLatestLedger();
  const expirationLedger = latestLedger.sequence + DEFAULT_TOKEN_ALLOWANCE_LEDGER_BUFFER;

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: tokenId,
        function: "approve",
        args: [
          Address.fromString(owner).toScVal(),
          Address.fromString(spender).toScVal(),
          nativeToScVal(amount, { type: "i128" }),
          nativeToScVal(expirationLedger, { type: "u32" }),
        ],
      })
    )
    .setTimeout(60)
    .build();

  const simulated = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(simulated)) {
    const message =
      "error" in simulated ? simulated.error : "Unable to simulate token approval.";
    throw new Error(`Simulation failed: ${message}`);
  }
  return rpc.assembleTransaction(tx, simulated).build();
}

export async function buildApproveUsdcTransaction(args: {
  owner: string;
  amount: bigint;
  spender?: string;
  tokenId?: string;
}) {
  return buildApproveTokenTransaction(args);
}

// ─── Write: generic signed transaction dispatcher ─────────────────────────────

export async function submitSignedTransaction({
  tx,
  signTx,
}: {
  tx: Transaction;
  signTx: (txXdr: string) => Promise<string>;
}): Promise<{ txHash: string }> {
  const prepared = await server.prepareTransaction(tx);
  const signedXdr = await signTx(prepared.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE) as Transaction;
  const sent = await server.sendTransaction(signedTx);

  if (!sent.hash || !sent.status) {
    throw new Error("RPC server returned an invalid transaction response.");
  }
  if (!ACCEPTED_SEND_STATUSES.has(sent.status)) {
    throw new Error(`Transaction submission failed with status ${sent.status}.`);
  }

  const finalResult = await server.pollTransaction(sent.hash, { attempts: POLL_ATTEMPTS });
  if (finalResult.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction failed with status ${String(finalResult.status)}.`);
  }
  return { txHash: sent.hash };
}
