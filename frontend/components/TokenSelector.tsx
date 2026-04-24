"use client";

import type { ApprovedToken } from "../hooks/useApprovedTokens";

function tokenAccentClasses(symbol: string): string {
  switch (symbol) {
    case "EURC":
      return "bg-sky-100 text-sky-700 border-sky-200";
    case "USDC":
      return "bg-indigo-100 text-indigo-700 border-indigo-200";
    default:
      return "bg-surface-container-high text-on-surface border-outline-variant/20";
  }
}

export function TokenIcon({
  token,
  className = "",
}: {
  token: Pick<ApprovedToken, "iconLabel" | "symbol">;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-black tracking-[0.14em] ${tokenAccentClasses(token.symbol)} ${className}`}
      aria-hidden="true"
    >
      {token.iconLabel}
    </span>
  );
}

export function TokenAmount({
  amount,
  token,
  className = "",
}: {
  amount: string;
  token: ApprovedToken;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <TokenIcon token={token} className="h-6 w-6 text-[9px]" />
      <span>{amount}</span>
    </span>
  );
}

export default function TokenSelector({
  label,
  value,
  tokens,
  error,
  hint,
  disabled,
  readOnly = false,
  onChange,
}: {
  label: string;
  value: string;
  tokens: ApprovedToken[];
  error?: string;
  hint?: string;
  disabled?: boolean;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}) {
  const selectedToken = tokens.find((token) => token.contractId === value) ?? tokens[0] ?? null;

  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.22em] text-on-surface-variant">{label}</span>
        {error ? <span className="text-xs font-bold text-error">{error}</span> : null}
      </div>

      {readOnly && selectedToken ? (
        <div className="flex items-center justify-between rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5">
          <div className="flex items-center gap-3">
            <TokenIcon token={selectedToken} />
            <div>
              <p className="text-sm font-bold text-on-surface">{selectedToken.symbol}</p>
              <p className="text-xs text-on-surface-variant">{selectedToken.name}</p>
            </div>
          </div>
          <span className="text-xs font-mono text-on-surface-variant">{selectedToken.contractId.slice(0, 8)}...</span>
        </div>
      ) : (
        <div className="relative">
          {selectedToken ? (
            <div className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-3">
              <TokenIcon token={selectedToken} />
              <span className="hidden text-sm font-bold text-on-surface sm:inline">{selectedToken.symbol}</span>
            </div>
          ) : null}
          <select
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            disabled={disabled}
            className="w-full appearance-none rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 pr-12 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 sm:pl-28"
          >
            {tokens.map((token) => (
              <option key={token.contractId} value={token.contractId}>
                {token.symbol} - {token.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            <span className="material-symbols-outlined text-base">expand_more</span>
          </span>
        </div>
      )}

      {hint ? <p className="mt-2 text-xs text-on-surface-variant">{hint}</p> : null}
    </label>
  );
}
