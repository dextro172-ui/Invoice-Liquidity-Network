"use client";

import { formatAddress, formatDate, formatUSDC, calculateYield } from "../utils/format";
import type { Invoice } from "../utils/soroban";

interface LPPortfolioProps {
  invoices: Invoice[];
  isLoading: boolean;
  onClaimDefault: (invoice: Invoice) => Promise<void>;
  claimingInvoiceId: string | null;
}

export default function LPPortfolio({
  invoices,
  isLoading,
  onClaimDefault,
  claimingInvoiceId,
}: LPPortfolioProps) {
  const now = Date.now();
  const totalYieldEarned = invoices
    .filter((invoice) => invoice.status === "Paid")
    .reduce((total, invoice) => total + calculateYield(invoice.amount, invoice.discount_rate), 0n);

  return (
    <div className="space-y-4 p-6">
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Total Yield Earned</p>
        <p className="mt-1 text-2xl font-bold text-green-700">{formatUSDC(totalYieldEarned)}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-dim">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">ID</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Freelancer</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Amount Funded</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Discount %</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Due Date</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Status</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Yield Earned</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-dim">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-on-surface-variant italic">
                  Loading LP portfolio...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-on-surface-variant italic">
                  No funded invoices found for this wallet.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => {
                const invoiceId = invoice.id.toString();
                const isPastDue = Number(invoice.due_date) * 1000 < now;
                const isClaimEligible = invoice.status === "Funded" && isPastDue;
                const isClaiming = claimingInvoiceId === invoiceId;
                const yieldAmount = calculateYield(invoice.amount, invoice.discount_rate);

                return (
                  <tr key={invoiceId} className="hover:bg-surface-variant/10 transition-colors">
                    <td className="px-6 py-5 font-bold text-primary">#{invoiceId}</td>
                    <td className="px-6 py-5">{formatAddress(invoice.freelancer)}</td>
                    <td className="px-6 py-5 font-bold">{formatUSDC(invoice.amount)}</td>
                    <td className="px-6 py-5">{(invoice.discount_rate / 100).toFixed(2)}%</td>
                    <td className="px-6 py-5">{formatDate(invoice.due_date)}</td>
                    <td className="px-6 py-5">
                      <span className="rounded px-2 py-1 text-xs font-bold bg-surface-container-low text-on-surface">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-bold">
                      {invoice.status === "Paid" ? (
                        <span className="text-green-600">{formatUSDC(yieldAmount)}</span>
                      ) : (
                        <span className="text-on-surface-variant">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      {isClaimEligible ? (
                        <button
                          onClick={() => onClaimDefault(invoice)}
                          disabled={isClaiming}
                          className="rounded-lg bg-error px-3 py-2 text-xs font-bold text-on-error transition-all hover:opacity-90 disabled:opacity-60"
                        >
                          {isClaiming ? "Claiming..." : "Claim Default"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
