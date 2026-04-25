
export interface TokenDisplayMeta {
  symbol: string;
  decimals: number;
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

/**
 * Formats a raw on-chain amount (bigint, in smallest unit) using the token's
 * decimal precision. Trims trailing zeros and groups the integer part.
 *
 * Examples:
 *   formatTokenAmount(10_000_000n, { symbol: "USDC", decimals: 7 }) → "1 USDC"
 *   formatTokenAmount(15_500_000n, { symbol: "USDC", decimals: 7 }) → "1.55 USDC"
 */
export function formatTokenAmount(
  amount: bigint,
  token: TokenDisplayMeta = { symbol: "USDC", decimals: 7 },
): string {
  const negative = amount < 0n;
  const absolute = negative ? amount * -1n : amount;
  const divisor = 10n ** BigInt(token.decimals);
  const whole = absolute / divisor;
  const fraction = absolute % divisor;
  const trimmedFraction = fraction
    .toString()
    .padStart(token.decimals, "0")
    .replace(/0+$/, "");
  const formattedWhole = new Intl.NumberFormat("en-US").format(Number(whole));
  const value = trimmedFraction
    ? `${formattedWhole}.${trimmedFraction}`
    : formattedWhole;

  return `${negative ? "-" : ""}${value} ${token.symbol}`;
}

/** Shorthand for USDC display — used throughout the app. */
export function formatUSDC(amount: bigint): string {
  return formatTokenAmount(amount, { symbol: "USDC", decimals: 7 });
}

export function formatAddress(address: string): string {
  if (!address) return "";
  return address.substring(0, 6) + "..." + address.substring(address.length - 4);
}

export function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleDateString();
}

export function calculateYield(amount: bigint, discount_rate: number): bigint {
  return (amount * BigInt(discount_rate)) / BigInt(10_000);
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return new Date(timestamp).toLocaleDateString();
}
