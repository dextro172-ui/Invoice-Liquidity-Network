import { StrKey } from "@stellar/stellar-sdk";

export const STROOPS_PER_USDC = 10_000_000;
export const MAX_DISCOUNT_RATE_PERCENT = 50;

export interface InvoiceFormValues {
  payer: string;
  amount: string;
  dueDate: string;
  discountRate: string;
}

export interface YieldPreview {
  amountStroops: bigint;
  amountUsdc: string;
  payoutStroops: bigint;
  payoutUsdc: string;
  yieldStroops: bigint;
  yieldUsdc: string;
  discountRatePercent: number;
  discountRateBps: number;
}

export function isValidStellarAccount(address: string): boolean {
  return StrKey.isValidEd25519PublicKey(address.trim());
}

export function parseAmountToStroops(value: string): bigint | null {
  const normalized = value.trim();

  if (!normalized || !/^\d+(\.\d{0,7})?$/.test(normalized)) {
    return null;
  }

  const [wholePart, decimalPart = ""] = normalized.split(".");
  const whole = BigInt(wholePart || "0") * BigInt(STROOPS_PER_USDC);
  const paddedDecimals = (decimalPart + "0000000").slice(0, 7);

  return whole + BigInt(paddedDecimals);
}

export function parseDiscountRateToBps(value: string): number | null {
  const rate = Number.parseFloat(value);

  if (!Number.isFinite(rate) || rate <= 0 || rate > MAX_DISCOUNT_RATE_PERCENT) {
    return null;
  }

  return Math.round(rate * 100);
}

export function toUnixTimestamp(date: string): number | null {
  if (!date) return null;

  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const parsed = new Date(year, month - 1, day, 0, 0, 0, 0);
  const timestamp = Math.floor(parsed.getTime() / 1000);

  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return timestamp;
}

export function getMinimumDueDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const year = tomorrow.getFullYear();
  const month = `${tomorrow.getMonth() + 1}`.padStart(2, "0");
  const day = `${tomorrow.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatUsdcFromStroops(value: bigint): string {
  const negative = value < 0n;
  const absoluteValue = negative ? value * -1n : value;
  const whole = absoluteValue / BigInt(STROOPS_PER_USDC);
  const fraction = absoluteValue % BigInt(STROOPS_PER_USDC);
  const formattedFraction = fraction.toString().padStart(7, "0").replace(/0+$/, "");
  const formattedWhole = new Intl.NumberFormat("en-US").format(Number(whole));
  const amount = formattedFraction ? `${formattedWhole}.${formattedFraction}` : formattedWhole;

  return `${negative ? "-" : ""}${amount}`;
}

export function getYieldPreview(amount: string, discountRate: string): YieldPreview {
  const amountStroops = parseAmountToStroops(amount) ?? 0n;
  const discountRatePercent = Number.parseFloat(discountRate);
  const safePercent = Number.isFinite(discountRatePercent) && discountRatePercent > 0
    ? discountRatePercent
    : 0;
  const discountRateBps = Math.max(0, Math.round(safePercent * 100));
  const yieldStroops = (amountStroops * BigInt(discountRateBps)) / 10_000n;
  const payoutStroops = amountStroops - yieldStroops;

  return {
    amountStroops,
    amountUsdc: formatUsdcFromStroops(amountStroops),
    payoutStroops,
    payoutUsdc: formatUsdcFromStroops(payoutStroops),
    yieldStroops,
    yieldUsdc: formatUsdcFromStroops(yieldStroops),
    discountRatePercent: safePercent,
    discountRateBps,
  };
}

export function validateInvoiceForm(
  values: InvoiceFormValues,
  walletConnected: boolean,
  nowInSeconds = Math.floor(Date.now() / 1000),
): Partial<Record<keyof InvoiceFormValues | "wallet", string>> {
  const errors: Partial<Record<keyof InvoiceFormValues | "wallet", string>> = {};

  if (!walletConnected) {
    errors.wallet = "Connect your Freighter wallet to submit an invoice.";
  }

  if (!values.payer.trim()) {
    errors.payer = "Payer Stellar address is required.";
  } else if (!isValidStellarAccount(values.payer)) {
    errors.payer = "Enter a valid Stellar public key for the payer.";
  }

  const amountStroops = parseAmountToStroops(values.amount);
  if (amountStroops === null || amountStroops <= 0n) {
    errors.amount = "Enter a valid invoice amount in USDC.";
  }

  const dueDate = toUnixTimestamp(values.dueDate);
  if (dueDate === null) {
    errors.dueDate = "Select a valid due date.";
  } else if (dueDate <= nowInSeconds) {
    errors.dueDate = "Due date must be in the future.";
  }

  const discountRateBps = parseDiscountRateToBps(values.discountRate);
  if (discountRateBps === null) {
    errors.discountRate = `Discount rate must be between 0.01% and ${MAX_DISCOUNT_RATE_PERCENT}%.`;
  }

  return errors;
}

export function formatMoney(value: number | string): string {
  const normalized = typeof value === "number" ? value.toFixed(2) : value;
  const [wholePart, decimalPart = "00"] = normalized.split(".");
  const sanitizedWhole = wholePart.replace(/,/g, "");
  const formattedWhole = new Intl.NumberFormat("en-US").format(Number(sanitizedWhole || "0"));
  return `$${formattedWhole}.${decimalPart.padEnd(2, "0").slice(0, 2)}`;
}
