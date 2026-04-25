/**
 * SkeletonRow — a single animated placeholder row for invoice tables.
 *
 * Each cell contains a shimmer div whose width is driven by the `widths` prop,
 * so the skeleton matches the real columns exactly (no layout shift).
 *
 * Usage:
 *   <SkeletonRow columns={lpDiscoveryWidths} />
 *
 * The shimmer animation is defined in globals.css (.skeleton-cell).
 */

interface SkeletonRowProps {
  /** Tailwind width classes for each cell's inner pill, e.g. ["w-8", "w-32", ...] */
  columns: string[];
  /** Row height — defaults to py-5 to match real table rows */
  rowClass?: string;
}

export default function SkeletonRow({ columns, rowClass = "py-5" }: SkeletonRowProps) {
  return (
    <tr className="border-b border-surface-dim last:border-0" aria-hidden="true">
      {columns.map((width, i) => (
        <td key={i} className={`px-6 ${rowClass}`}>
          <div className={`skeleton-cell h-4 ${width}`} />
        </td>
      ))}
    </tr>
  );
}

// ─── Pre-defined column-width sets ───────────────────────────────────────────
// Keep these in sync with the real table column content widths.

/** LP Discovery table: ID · Freelancer · Amount · Discount · Due Date · Est. Yield · (action) */
export const LP_DISCOVERY_COLUMNS = [
  "w-8",   // ID
  "w-32",  // Freelancer (two lines)
  "w-24",  // Amount
  "w-16",  // Discount badge
  "w-20",  // Due Date
  "w-20",  // Est. Yield
  "w-16",  // Fund button
];

/** LP My-Funded / Portfolio table — same column structure */
export const LP_PORTFOLIO_COLUMNS = LP_DISCOVERY_COLUMNS;

/** Freelancer My-Invoices table: ID · Payer · Amount · Discount · Due Date · Status */
export const FREELANCER_COLUMNS = [
  "w-8",   // ID
  "w-28",  // Payer
  "w-24",  // Amount
  "w-16",  // Discount badge
  "w-20",  // Due Date
  "w-20",  // Status badge
];
