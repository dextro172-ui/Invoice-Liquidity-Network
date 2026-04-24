# `@invoice-liquidity/sdk`

Typed JavaScript and TypeScript SDK for the Invoice Liquidity Network Soroban contract on Stellar.

## Install

```bash
npm install @invoice-liquidity/sdk
```

## Quickstart

### Browser + Freighter

```ts
import { ILNSdk, ILN_TESTNET, createFreighterSigner } from "@invoice-liquidity/sdk";

const sdk = new ILNSdk({
  ...ILN_TESTNET,
  signer: createFreighterSigner(),
});

const invoiceId = await sdk.submitInvoice({
  freelancer: "G...",
  payer: "G...",
  amount: 25_000_000n,
  dueDate: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  discountRate: 300,
});

await sdk.fundInvoice({
  funder: "G...",
  invoiceId,
});

await sdk.markPaid({
  invoiceId,
});

const invoice = await sdk.getInvoice(invoiceId);
console.log(invoice.status);
```

### Node.js

```ts
import { ILNSdk, ILN_TESTNET, createKeypairSigner } from "@invoice-liquidity/sdk";

const sdk = new ILNSdk({
  ...ILN_TESTNET,
  signer: createKeypairSigner(process.env.STELLAR_SECRET_KEY!),
});

const invoice = await sdk.getInvoice(1n);
console.log(invoice);
```

## API

```ts
submitInvoice(params: {
  freelancer: string;
  payer: string;
  amount: bigint;
  dueDate: number;
  discountRate: number;
}): Promise<bigint>;

fundInvoice(params: {
  funder: string;
  invoiceId: bigint;
}): Promise<void>;

markPaid(params: {
  invoiceId: bigint;
}): Promise<void>;

getInvoice(invoiceId: bigint): Promise<Invoice>;
```

## Invoice type

```ts
type InvoiceStatus = "Pending" | "Funded" | "Paid" | "Defaulted";

interface Invoice {
  id: bigint;
  freelancer: string;
  payer: string;
  amount: bigint;
  dueDate: number;
  discountRate: number;
  status: InvoiceStatus;
  funder: string | null;
  fundedAt: number | null;
}
```

## Development

```bash
cd sdk
npm install
npm test
```
