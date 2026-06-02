# Multi-Token Support

Invoice Liquidity Network supports invoices denominated in allowlisted Stellar assets. The production token set is USDC, EURC, and XLM. Each token has its own decimal precision, acquisition path, trustline behavior, and Soroban token contract shape, so client code should treat the invoice token as part of the invoice data model instead of assuming one global unit.

For SDK-side amount helpers and client calls, see the [SDK Token Amounts](../../sdk/README.md#token-amounts). Use token-aware helpers in application code whenever possible and pass contract amounts as `bigint` base units.

## Supported Tokens

| Token | Asset type | Decimals | Smallest unit | Testnet acquisition | Trustline required | Notes |
| --- | --- | ---: | --- | --- | --- | --- |
| USDC | Issued Stellar asset exposed through a Soroban token contract | 6 | `0.000001 USDC` | Fund the account with testnet XLM, add a USDC trustline, then mint or receive test USDC from the testnet issuer/tooling | Yes | Stablecoin-style asset. Do not format it with the 7-decimal XLM stroop scale. |
| EURC | Issued Stellar asset exposed through a Soroban token contract | 6 | `0.000001 EURC` | Fund the account with testnet XLM, add a EURC trustline, then mint or receive test EURC from the testnet issuer/tooling | Yes | Same decimal scale as USDC, but distinct issuer and token contract. |
| XLM | Native Stellar asset exposed through the native Stellar Asset Contract wrapper | 7 | `0.0000001 XLM` | Use Friendbot to fund the account directly on testnet | No | Native balances pay fees and reserves. The Soroban token ID is the SAC wrapper for native XLM, not a classic trustline asset. |

Known testnet issuers used by the development seeder:

| Token | Testnet issuer |
| --- | --- |
| USDC | `GBUQWP3BOUZX34TBIGK5ILGKDFHTQCXY4IQ7ZLVTLZHVNCV3XVJVTSC` |
| EURC | `GCNY5OXYSY4FZLQS2B4J5NE6BNUL37AJQ4NZ4PROUGH6TWYJF6XZMFC` |

## Decimal Precision

Store and submit all invoice amounts in token base units:

- USDC uses 6 decimals, so `1 USDC` is `1_000_000` base units.
- EURC uses 6 decimals, so `1 EURC` is `1_000_000` base units.
- XLM uses 7 decimals, so `1 XLM` is `10_000_000` stroops.

Never convert token amounts with JavaScript `number` multiplication for user-entered values. Decimal floating point can round values before they become `bigint`. Parse the display string, enforce the token's maximum fractional digits, and then construct the integer base-unit value.

```ts
const TOKEN_DECIMALS = {
  USDC: 6,
  EURC: 6,
  XLM: 7,
} as const;

type SupportedToken = keyof typeof TOKEN_DECIMALS;

export function parseTokenAmount(displayAmount: string, token: SupportedToken): bigint {
  const decimals = TOKEN_DECIMALS[token];
  const trimmed = displayAmount.trim();
  const match = trimmed.match(/^(\d+)(?:\.(\d+))?$/);

  if (!match) {
    throw new Error("Amount must be a positive decimal value.");
  }

  const fractional = match[2] ?? "";

  if (fractional.length > decimals) {
    throw new Error(`${token} supports at most ${decimals} decimal places.`);
  }

  const whole = BigInt(match[1]);
  const fraction = BigInt(fractional.padEnd(decimals, "0") || "0");
  const scale = 10n ** BigInt(decimals);

  return whole * scale + fraction;
}

export function formatTokenAmount(baseUnits: bigint, token: SupportedToken): string {
  const decimals = TOKEN_DECIMALS[token];
  const scale = 10n ** BigInt(decimals);
  const negative = baseUnits < 0n;
  const absolute = negative ? -baseUnits : baseUnits;
  const whole = absolute / scale;
  const fraction = (absolute % scale).toString().padStart(decimals, "0").replace(/0+$/, "");
  const rendered = fraction ? `${whole}.${fraction}` : whole.toString();

  return negative ? `-${rendered}` : rendered;
}
```

Correct per-token conversions:

```ts
parseTokenAmount("125.50", "USDC"); // 125_500_000n
parseTokenAmount("125.50", "EURC"); // 125_500_000n
parseTokenAmount("125.5000001", "XLM"); // 1_255_000_001n

formatTokenAmount(1_000_000n, "USDC"); // "1"
formatTokenAmount(1_000_000n, "EURC"); // "1"
formatTokenAmount(10_000_000n, "XLM"); // "1"
```

Submitting an invoice should carry both the selected token and the token-scaled amount:

```ts
import { ILNSdk, ILN_TESTNET, createFreighterSigner } from "@invoice-liquidity/sdk";

const token = "USDC" as const;
const amount = parseTokenAmount("2500.00", token);

const sdk = new ILNSdk({
  ...ILN_TESTNET,
  signer: createFreighterSigner(),
});

await sdk.submitInvoice({
  freelancer: "G...",
  payer: "G...",
  amount,
  dueDate: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  discountRate: 300,
});
```

## Acquiring Tokens On Testnet

All testnet accounts need XLM first because XLM pays transaction fees and account reserves.

1. Create or import a Stellar testnet keypair.
2. Fund it with Friendbot:

```bash
curl "https://friendbot.stellar.org/?addr=G..."
```

3. For USDC and EURC, add trustlines before receiving issued assets. The CLI seeder automates this:

```bash
iln dev seed
```

4. Mint or receive test USDC/EURC using the configured testnet issuer and Soroban token contract tooling. The generated `.env.testnet.accounts` file records the seeded account keys and the testnet issuers.

XLM does not need a trustline. A Friendbot-funded account can hold and spend testnet XLM immediately, subject to the minimum reserve and transaction fees.

## Trustline Requirements

USDC and EURC are issued assets. Before an account can hold either asset on Stellar testnet, it must submit a `changeTrust` operation for the asset code and issuer. The development seeder creates trustlines for the `freelancer`, `payer`, and `liquidity_provider` accounts.

XLM is native to Stellar and cannot have a trustline. When used from Soroban, native XLM is addressed through the native Stellar Asset Contract wrapper. Client code still interacts with a token contract ID, but the underlying balance behavior is native:

- The same XLM balance pays fees, reserves, and protocol transfers.
- Available XLM can be lower than total balance because the account must keep its minimum reserve.
- There is no issuer account or trustline limit for native XLM.

## Token-Specific Quirks

USDC and EURC:

- Use 6 decimal places.
- Require trustlines for classic asset balances.
- Have separate issuers and separate Soroban token contracts.
- Should be displayed with stablecoin-style precision, commonly 2 decimals for UI summaries and up to 6 for exact values.

XLM:

- Uses 7 decimal places, also called stroops.
- Is acquired directly from Friendbot on testnet.
- Is represented in Soroban by the native SAC wrapper.
- Shares balance with fees and reserves, so integrations should leave enough spendable XLM for future transactions.

## Token Allowlist

The token allowlist defines which token contract IDs the protocol accepts for invoices and funding flows. Treat the allowlist as the source of truth for supported tokens in each deployment:

- A token is supported only when its Soroban token contract ID is present in the deployment allowlist.
- UI token pickers should be built from the allowlist, not from hard-coded symbols alone.
- Amount parsing should use the metadata for the selected allowlisted token.
- Adding a new token requires adding its contract ID and metadata, then updating tests, SDK helpers, and this documentation.
- Removing a token from the allowlist should disable new invoices for that token, while existing indexed invoice history may still reference it.

At minimum, keep this metadata beside each allowlisted token:

```ts
type TokenMetadata = {
  symbol: "USDC" | "EURC" | "XLM";
  contractId: string;
  decimals: 6 | 7;
  issuer?: string;
  requiresTrustline: boolean;
  acquisition: "friendbot" | "trustline-and-mint";
};
```

The allowlist prevents unsupported token contracts from entering protocol flows and protects clients from applying the wrong decimal precision to invoice amounts.
