"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Invoice } from "../utils/soroban";

export const INVOICE_STATUSES = ["Pending", "Funded", "Paid", "Defaulted", "Cancelled"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export type InvoiceFilters = {
  search: string;
  statuses: InvoiceStatus[];
  minAmount: string;
  maxAmount: string;
  startDate: string;
  endDate: string;
  token: string;
  minDiscountBps: string;
  maxDiscountBps: string;
};

export const EMPTY_INVOICE_FILTERS: InvoiceFilters = {
  search: "",
  statuses: [],
  minAmount: "",
  maxAmount: "",
  startDate: "",
  endDate: "",
  token: "",
  minDiscountBps: "",
  maxDiscountBps: "",
};

type UseInvoiceFiltersOptions = {
  namespace: string;
};

function parseNumeric(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getDateFromUnixSeconds(unixSeconds: bigint): Date {
  return new Date(Number(unixSeconds) * 1000);
}

function dateToInputValue(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function cleanStatusList(values: string[]): InvoiceStatus[] {
  const allowed = new Set(INVOICE_STATUSES);
  return values.filter((value): value is InvoiceStatus => allowed.has(value as InvoiceStatus));
}

function buildFilterQuery(searchParams: URLSearchParams, namespace: string, filters: InvoiceFilters): URLSearchParams {
  const prefix = `${namespace}_`;
  const next = new URLSearchParams(searchParams.toString());

  const setOrDelete = (key: string, value: string) => {
    if (value.trim()) {
      next.set(`${prefix}${key}`, value.trim());
    } else {
      next.delete(`${prefix}${key}`);
    }
  };

  setOrDelete("search", filters.search);
  setOrDelete("statuses", filters.statuses.join(","));
  setOrDelete("minAmount", filters.minAmount);
  setOrDelete("maxAmount", filters.maxAmount);
  setOrDelete("startDate", filters.startDate);
  setOrDelete("endDate", filters.endDate);
  setOrDelete("token", filters.token);
  setOrDelete("minDiscountBps", filters.minDiscountBps);
  setOrDelete("maxDiscountBps", filters.maxDiscountBps);

  return next;
}

function readFiltersFromParams(searchParams: URLSearchParams, namespace: string): InvoiceFilters {
  const prefix = `${namespace}_`;
  return {
    search: searchParams.get(`${prefix}search`) ?? "",
    statuses: cleanStatusList((searchParams.get(`${prefix}statuses`) ?? "").split(",").filter(Boolean)),
    minAmount: searchParams.get(`${prefix}minAmount`) ?? "",
    maxAmount: searchParams.get(`${prefix}maxAmount`) ?? "",
    startDate: searchParams.get(`${prefix}startDate`) ?? "",
    endDate: searchParams.get(`${prefix}endDate`) ?? "",
    token: searchParams.get(`${prefix}token`) ?? "",
    minDiscountBps: searchParams.get(`${prefix}minDiscountBps`) ?? "",
    maxDiscountBps: searchParams.get(`${prefix}maxDiscountBps`) ?? "",
  };
}

export function countActiveInvoiceFilters(filters: InvoiceFilters): number {
  return [
    Boolean(filters.search.trim()),
    filters.statuses.length > 0,
    Boolean(filters.minAmount.trim() || filters.maxAmount.trim()),
    Boolean(filters.startDate.trim() || filters.endDate.trim()),
    Boolean(filters.token.trim()),
    Boolean(filters.minDiscountBps.trim() || filters.maxDiscountBps.trim()),
  ].filter(Boolean).length;
}

export function applyInvoiceFilters(
  invoices: Invoice[],
  filters: InvoiceFilters,
  options?: { resolveTokenSymbol?: (invoice: Invoice) => string },
): Invoice[] {
  const search = filters.search.trim().toLowerCase();
  const minAmount = parseNumeric(filters.minAmount);
  const maxAmount = parseNumeric(filters.maxAmount);
  const minDiscount = parseNumeric(filters.minDiscountBps);
  const maxDiscount = parseNumeric(filters.maxDiscountBps);
  const statuses = new Set(filters.statuses);
  const start = filters.startDate ? new Date(`${filters.startDate}T00:00:00.000Z`) : null;
  const end = filters.endDate ? new Date(`${filters.endDate}T23:59:59.999Z`) : null;
  const selectedToken = filters.token.trim().toUpperCase();

  return invoices.filter((invoice) => {
    if (search) {
      const idValue = invoice.id.toString().toLowerCase();
      const payerValue = invoice.payer.toLowerCase();
      const freelancerValue = invoice.freelancer.toLowerCase();
      if (!idValue.includes(search) && !payerValue.includes(search) && !freelancerValue.includes(search)) {
        return false;
      }
    }

    if (statuses.size > 0 && !statuses.has(invoice.status as InvoiceStatus)) {
      return false;
    }

    const amountUsdc = Number(invoice.amount) / 10_000_000;
    if (minAmount !== null && amountUsdc < minAmount) return false;
    if (maxAmount !== null && amountUsdc > maxAmount) return false;

    const invoiceDate = getDateFromUnixSeconds(invoice.due_date);
    if (start && invoiceDate < start) return false;
    if (end && invoiceDate > end) return false;

    if (selectedToken) {
      const tokenSymbol = options?.resolveTokenSymbol?.(invoice).toUpperCase() ?? "USDC";
      if (tokenSymbol !== selectedToken) return false;
    }

    if (minDiscount !== null && invoice.discount_rate < minDiscount) return false;
    if (maxDiscount !== null && invoice.discount_rate > maxDiscount) return false;

    return true;
  });
}

export function useInvoiceFilters({ namespace }: UseInvoiceFiltersOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramsString = searchParams.toString();
  const filters = useMemo(
    () => readFiltersFromParams(new URLSearchParams(paramsString), namespace),
    [namespace, paramsString],
  );

  const replaceQuery = useCallback(
    (nextFilters: InvoiceFilters) => {
      const next = buildFilterQuery(new URLSearchParams(paramsString), namespace, nextFilters);
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [namespace, paramsString, pathname, router],
  );

  const updateFilters = useCallback(
    (updater: InvoiceFilters | ((current: InvoiceFilters) => InvoiceFilters)) => {
      const next = typeof updater === "function" ? updater(filters) : updater;
      replaceQuery(next);
    },
    [filters, replaceQuery],
  );

  const clearFilters = useCallback(() => {
    updateFilters(EMPTY_INVOICE_FILTERS);
  }, [updateFilters]);

  const activeFilterCount = useMemo(() => countActiveInvoiceFilters(filters), [filters]);

  return {
    filters,
    setFilters: updateFilters,
    clearFilters,
    activeFilterCount,
  };
}

export function formatInvoiceDateForInput(unixSeconds: bigint): string {
  return dateToInputValue(getDateFromUnixSeconds(unixSeconds));
}
