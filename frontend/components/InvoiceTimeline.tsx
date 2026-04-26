"use client";

import { useMemo, useState } from "react";
import { Invoice } from "../utils/soroban";
import { formatAddress, formatDate, formatUSDC } from "../utils/format";
import { getStatusBadgeClass, InvoiceStatusBadge } from "../src/screens/Dashboard";
import Link from "next/link";

interface InvoiceTimelineProps {
  invoices: Invoice[];
  loading: boolean;
}

type DateMarker = "Today" | "Yesterday" | "This week" | "Last month" | "Older";

interface GroupedInvoices {
  marker: DateMarker;
  invoices: Invoice[];
}

export default function InvoiceTimeline({ invoices, loading }: InvoiceTimelineProps) {
  const [pageSize, setPageSize] = useState(20);

  const groupedInvoices = useMemo(() => {
    // For now, using due_date or a mock submission date since submitted_at isn't on-chain.
    // In a real scenario, we'd fetch this from the indexer.
    // Let's sort by ID descending as a proxy for submission order if timestamps are missing.
    const sorted = [...invoices].sort((a, b) => Number(b.id - a.id));
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const thisWeek = today - 86400000 * 7;
    const lastMonth = today - 86400000 * 30;

    const groups: Record<DateMarker, Invoice[]> = {
      Today: [],
      Yesterday: [],
      "This week": [],
      "Last month": [],
      Older: [],
    };

    sorted.forEach((invoice) => {
      // MOCK: In production, use invoice.created_at from indexer.
      // Here we use a heuristic or just put everything in "Recently" if we don't have dates.
      // For the sake of the requirement, let's assume we have a created_at or use a stable fallback.
      const date = Number(invoice.funded_at || (invoice.due_date - 2592000n)) * 1000; 
      
      if (date >= today) groups.Today.push(invoice);
      else if (date >= yesterday) groups.Yesterday.push(invoice);
      else if (date >= thisWeek) groups["This week"].push(invoice);
      else if (date >= lastMonth) groups["Last month"].push(invoice);
      else groups.Older.push(invoice);
    });

    return (Object.entries(groups) as [DateMarker, Invoice[]][])
      .filter(([_, invs]) => invs.length > 0)
      .map(([marker, invs]) => ({ marker, invoices: invs }));
  }, [invoices]);

  const flattenedInvoices = useMemo(() => {
    return groupedInvoices.flatMap(g => g.invoices.map(inv => ({ marker: g.marker, invoice: inv })));
  }, [groupedInvoices]);

  const displayedEvents = flattenedInvoices.slice(0, pageSize);
  const hasMore = flattenedInvoices.length > pageSize;

  if (loading && invoices.length === 0) {
    return (
      <div className="py-14 text-center text-on-surface-variant">
        Loading timeline...
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="py-14 text-center text-on-surface-variant">
        No invoice activity found.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline-variant/30 before:to-transparent">
        {displayedEvents.map((event, index) => {
          const isFirstInMarker = index === 0 || displayedEvents[index - 1].marker !== event.marker;
          const { invoice } = event;

          return (
            <div key={invoice.id.toString()} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Marker dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-outline-variant bg-surface-container-lowest text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <span className="material-symbols-outlined text-sm">
                  {invoice.status === 'Paid' ? 'check_circle' : 
                   invoice.status === 'Funded' ? 'payments' : 
                   invoice.status === 'Defaulted' ? 'warning' : 'description'}
                </span>
              </div>

              {/* Card content */}
              <div className="w-[calc(100%-4rem)] md:w-[45%] p-4 rounded-2xl border border-outline-variant/30 bg-surface-container-low shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <time className="font-headline font-bold text-xs text-primary uppercase tracking-wider">
                    {isFirstInMarker ? event.marker : formatDate(invoice.due_date)}
                  </time>
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
                
                <div className="text-on-surface font-bold text-lg mb-1">
                  {formatUSDC(invoice.amount)}
                </div>
                
                <div className="text-on-surface-variant text-sm mb-3">
                  Payer: <span className="font-mono">{formatAddress(invoice.payer)}</span>
                </div>

                <div className="flex flex-col gap-2 border-t border-outline-variant/10 pt-3 mt-3">
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">event</span>
                    <span>
                      {invoice.status === 'Pending' && 'Submitted'}
                      {invoice.status === 'Funded' && `Funded on ${invoice.funded_at ? formatDate(invoice.funded_at) : 'recently'}`}
                      {invoice.status === 'Paid' && 'Paid in full'}
                      {invoice.status === 'Defaulted' && 'Defaulted'}
                    </span>
                  </div>
                  <Link 
                    href={`/i/${invoice.id.toString()}`}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    View Details <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="mt-12 text-center">
          <button
            onClick={() => setPageSize(prev => prev + 20)}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 px-6 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
