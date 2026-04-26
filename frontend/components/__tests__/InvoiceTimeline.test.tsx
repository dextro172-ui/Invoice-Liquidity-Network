import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import InvoiceTimeline from "../InvoiceTimeline";
import { Invoice } from "../../utils/soroban";

// Mocking required utilities
vi.mock("../../utils/format", () => ({
  formatAddress: (addr: string) => addr.slice(0, 4),
  formatDate: (ts: bigint) => new Date(Number(ts) * 1000).toLocaleDateString(),
  formatUSDC: (amt: bigint) => `${amt / 10000000n} USDC`,
}));

const mockInvoices: Invoice[] = [
  {
    id: 1n,
    freelancer: "G1",
    payer: "G2",
    amount: 100000000n,
    due_date: BigInt(Math.floor(Date.now() / 1000) + 86400 * 30),
    discount_rate: 500,
    status: "Pending",
  },
  {
    id: 2n,
    freelancer: "G1",
    payer: "G3",
    amount: 200000000n,
    due_date: BigInt(Math.floor(Date.now() / 1000) + 86400 * 30),
    discount_rate: 300,
    status: "Funded",
    funded_at: BigInt(Math.floor(Date.now() / 1000)),
  }
];

describe("InvoiceTimeline", () => {
  it("renders loading state", () => {
    render(<InvoiceTimeline invoices={[]} loading={true} />);
    expect(screen.getByText(/Loading timeline.../i)).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<InvoiceTimeline invoices={[]} loading={false} />);
    expect(screen.getByText(/No invoice activity found./i)).toBeInTheDocument();
  });

  it("renders invoices grouped by date", () => {
    render(<InvoiceTimeline invoices={mockInvoices} loading={false} />);
    expect(screen.getByText("10 USDC")).toBeInTheDocument();
    expect(screen.getByText("20 USDC")).toBeInTheDocument();
    expect(screen.getByText(/Funded on/i)).toBeInTheDocument();
  });
});
