import { describe, expect, it } from "vitest";
import { applyInvoiceFilters, countActiveInvoiceFilters, EMPTY_INVOICE_FILTERS } from "../hooks/useInvoiceFilters";
import type { Invoice } from "../utils/soroban";

function makeInvoice(
  id: bigint,
  status: Invoice["status"],
  amount: bigint,
  dueDate: bigint,
  discountRate: number,
  token?: string,
): Invoice {
  return {
    id,
    freelancer: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    payer: "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBRY",
    amount,
    due_date: dueDate,
    discount_rate: discountRate,
    status,
    token,
    funder: undefined,
    funded_at: undefined,
  };
}

describe("invoice filter logic", () => {
  const invoices: Invoice[] = [
    makeInvoice(101n, "Pending", 100n * 10_000_000n, 1_760_000_000n, 300, "token-usdc"),
    makeInvoice(202n, "Funded", 500n * 10_000_000n, 1_770_000_000n, 900, "token-eurc"),
    makeInvoice(303n, "Paid", 900n * 10_000_000n, 1_780_000_000n, 1200, "token-xlm"),
  ];

  it("searches by id and address fragments", () => {
    const byId = applyInvoiceFilters(invoices, { ...EMPTY_INVOICE_FILTERS, search: "202" });
    expect(byId.map((invoice) => invoice.id)).toEqual([202n]);

    const byAddress = applyInvoiceFilters(invoices, {
      ...EMPTY_INVOICE_FILTERS,
      search: "aaaaaaa",
    });
    expect(byAddress).toHaveLength(3);
  });

  it("applies status, amount, due date, token, and discount ranges", () => {
    const filtered = applyInvoiceFilters(
      invoices,
      {
        ...EMPTY_INVOICE_FILTERS,
        statuses: ["Funded", "Paid"],
        minAmount: "400",
        maxAmount: "950",
        startDate: "2026-01-01",
        endDate: "2026-07-30",
        token: "EURC",
        minDiscountBps: "500",
        maxDiscountBps: "1000",
      },
      {
        resolveTokenSymbol: (invoice) => {
          if (invoice.token === "token-eurc") return "EURC";
          if (invoice.token === "token-xlm") return "XLM";
          return "USDC";
        },
      },
    );

    expect(filtered.map((invoice) => invoice.id)).toEqual([202n]);
  });

  it("counts active filter groups correctly", () => {
    expect(
      countActiveInvoiceFilters({
        ...EMPTY_INVOICE_FILTERS,
        search: "10",
        statuses: ["Pending"],
        minAmount: "10",
        token: "USDC",
      }),
    ).toBe(4);
  });
});
