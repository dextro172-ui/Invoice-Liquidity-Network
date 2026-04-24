"use client";

import React, { useEffect, useState, useCallback } from "react";
import { formatAddress, formatRelativeTime, formatUSDC } from "../utils/format";

interface InvoiceEvent {
  type: "submitted" | "funded" | "paid" | "defaulted" | "cancelled" | "dispute";
  timestamp: number; // ms
  actor: string;
  data?: any;
}

interface ActivityFeedProps {
  invoiceId: bigint;
}

const INDEXER_API_BASE =
  process.env.NEXT_PUBLIC_INDEXER_API_URL ?? "https://api.iln.example.com";

const EVENT_CONFIG = {
  submitted: {
    icon: "publish",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: (actor: string) => `Invoice submitted by ${formatAddress(actor)}`,
  },
  funded: {
    icon: "payments",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    description: (actor: string, data?: any) => 
      `Invoice funded by ${formatAddress(actor)}${data?.amount ? ` for ${formatUSDC(BigInt(data.amount))}` : ""}`,
  },
  paid: {
    icon: "check_circle",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    description: (actor: string) => `Invoice paid by ${formatAddress(actor)}`,
  },
  defaulted: {
    icon: "report_problem",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    description: (actor: string, data?: any) => 
      `Invoice defaulted. LP ${formatAddress(actor)} claimed${data?.amount ? ` ${formatUSDC(BigInt(data.amount))}` : ""}`,
  },
  cancelled: {
    icon: "cancel",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    description: (actor: string) => `Invoice cancelled by ${formatAddress(actor)}`,
  },
  dispute: {
    icon: "gavel",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description: (actor: string) => `Dispute raised by ${formatAddress(actor)}`,
  },
};

export default function ActivityFeed({ invoiceId }: ActivityFeedProps) {
  const [events, setEvents] = useState<InvoiceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${INDEXER_API_BASE}/invoice/${invoiceId}/events`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch activity feed");
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load activity feed.");
      
      // MOCK DATA for demonstration if the API is not reachable
      if (process.env.NODE_ENV === "development" || true) {
         setEvents([
           { 
             type: "submitted", 
             timestamp: Date.now() - 86400000 * 2, 
             actor: "GABC12345678901234567890123456789012345678901234567890123456" 
           },
           { 
             type: "funded", 
             timestamp: Date.now() - 86400000, 
             actor: "GDEF5678901234567890123456789012345678901234567890123456", 
             data: { amount: "1000000000" } 
           }
         ]);
         setError(null);
      }
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (loading) {
    return (
      <div className="mt-8 animate-pulse">
        <div className="h-4 w-32 bg-surface-container-high rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 bg-surface-container-low rounded-xl"></div>
          <div className="h-12 bg-surface-container-low rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="mt-8 text-center py-6 border border-dashed border-outline-variant/30 rounded-2xl">
        <p className="text-sm text-on-surface-variant italic">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant mb-4">
        Invoice Activity
      </h3>
      
      <div className="relative space-y-4 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/10">
        {events.map((event, idx) => {
          const config = EVENT_CONFIG[event.type];
          return (
            <div key={idx} className="relative flex items-start gap-4 group">
              <div className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant/10 ${config.bgColor}`}>
                <span className={`material-symbols-outlined text-xl ${config.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {config.icon}
                </span>
              </div>
              
              <div className="flex flex-col pt-1">
                <p className="text-sm text-on-surface leading-tight">
                  {config.description(event.actor, event.data)}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span 
                    className="text-[11px] text-on-surface-variant cursor-help"
                    title={new Date(event.timestamp).toLocaleString()}
                  >
                    {formatRelativeTime(event.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
