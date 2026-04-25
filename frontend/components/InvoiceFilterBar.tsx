"use client";

import { useState } from "react";
import {
  INVOICE_STATUSES,
  type InvoiceFilters,
  type InvoiceStatus,
} from "../hooks/useInvoiceFilters";

type InvoiceFilterBarProps = {
  filters: InvoiceFilters;
  onFiltersChange: (updater: InvoiceFilters | ((current: InvoiceFilters) => InvoiceFilters)) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
  className?: string;
};

const TOKEN_OPTIONS = ["USDC", "EURC", "XLM"] as const;

export default function InvoiceFilterBar({
  filters,
  onFiltersChange,
  onClearFilters,
  activeFilterCount,
  className,
}: InvoiceFilterBarProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const containerClass = className ? `space-y-3 ${className}` : "space-y-3";

  return (
    <div className={containerClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="search"
          value={filters.search}
          placeholder="Search by invoice ID, payer, or freelancer address"
          onChange={(event) => {
            const value = event.target.value;
            onFiltersChange((current) => ({ ...current, search: value }));
          }}
          className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 px-3 py-2 text-sm font-medium text-on-surface-variant hover:border-primary/40 hover:text-primary"
          >
            Filters
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>

          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs font-bold uppercase tracking-wide text-primary hover:underline"
            >
              Clear all filters
            </button>
          ) : null}
        </div>
      </div>

      {isAdvancedOpen ? (
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Status</p>
              <div className="grid grid-cols-2 gap-2">
                {INVOICE_STATUSES.map((status) => (
                  <label key={status} className="inline-flex items-center gap-2 text-xs text-on-surface">
                    <input
                      type="checkbox"
                      checked={filters.statuses.includes(status)}
                      onChange={(event) =>
                        onFiltersChange((current) => {
                          const statuses = new Set<InvoiceStatus>(current.statuses);
                          if (event.target.checked) {
                            statuses.add(status);
                          } else {
                            statuses.delete(status);
                          }
                          return { ...current, statuses: Array.from(statuses) };
                        })
                      }
                    />
                    <span>{status}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Amount (USDC)</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.minAmount}
                  placeholder="Min"
                  onChange={(event) =>
                    onFiltersChange((current) => ({ ...current, minAmount: event.target.value }))
                  }
                  className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.maxAmount}
                  placeholder="Max"
                  onChange={(event) =>
                    onFiltersChange((current) => ({ ...current, maxAmount: event.target.value }))
                  }
                  className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Due Date</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(event) =>
                    onFiltersChange((current) => ({ ...current, startDate: event.target.value }))
                  }
                  className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(event) =>
                    onFiltersChange((current) => ({ ...current, endDate: event.target.value }))
                  }
                  className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Token</p>
              <select
                value={filters.token}
                onChange={(event) => onFiltersChange((current) => ({ ...current, token: event.target.value }))}
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {TOKEN_OPTIONS.map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Discount (bps)</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={filters.minDiscountBps}
                  placeholder="Min"
                  onChange={(event) =>
                    onFiltersChange((current) => ({ ...current, minDiscountBps: event.target.value }))
                  }
                  className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={filters.maxDiscountBps}
                  placeholder="Max"
                  onChange={(event) =>
                    onFiltersChange((current) => ({ ...current, maxDiscountBps: event.target.value }))
                  }
                  className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
