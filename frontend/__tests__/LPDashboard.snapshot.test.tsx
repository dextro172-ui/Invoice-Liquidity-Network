import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LPDashboard from "../components/LPDashboard";
import { FIXTURE_ADDRESSES, allInvoiceFixtures, invoiceFixtures } from "./fixtures/invoices";

const approvedTokens = [
  { contractId: "token-usdc", name: "USD Coin", symbol: "USDC", decimals: 7, iconLabel: "US" },
  { contractId: "token-eurc", name: "Euro Coin", symbol: "EURC", decimals: 7, iconLabel: "EU" },
];

const walletState = {
  address: FIXTURE_ADDRESSES.lp,
  isConnected: true,
  isInstalled: true,
  error: null as string | null,
  networkMismatch: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  signTx: vi.fn(),
};

const addToast = vi.fn(() => "toast-id");
const updateToast = vi.fn();
const getAllInvoices = vi.fn();
const getUsdcAllowance = vi.fn();

vi.mock("../context/WalletContext", () => ({
  useWallet: () => walletState,
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => ({
    addToast,
    updateToast,
  }),
}));

vi.mock("../hooks/useApprovedTokens", () => ({
  useApprovedTokens: () => ({
    tokens: approvedTokens,
    tokenMap: new Map(approvedTokens.map((token) => [token.contractId, token])),
    defaultToken: approvedTokens[0],
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../utils/soroban", async () => {
  const actual = await vi.importActual<typeof import("../utils/soroban")>("../utils/soroban");

  return {
    ...actual,
    getAllInvoices: (...args: unknown[]) => getAllInvoices(...args),
    getTokenAllowance: (...args: unknown[]) => getUsdcAllowance(...args),
    buildApproveTokenTransaction: vi.fn(),
    fundInvoice: vi.fn(),
    submitSignedTransaction: vi.fn(),
  };
});

describe("LPDashboard snapshots", () => {
  beforeEach(() => {
    walletState.address = FIXTURE_ADDRESSES.lp;
    walletState.isConnected = true;
    walletState.networkMismatch = false;
    walletState.connect.mockReset();
    walletState.disconnect.mockReset();
    walletState.signTx.mockReset();
    addToast.mockClear();
    updateToast.mockClear();
    getAllInvoices.mockReset();
    getUsdcAllowance.mockReset();
    getAllInvoices.mockResolvedValue(allInvoiceFixtures);
    getUsdcAllowance.mockResolvedValue(0n);
  });

  it("matches the invoice table discovery state with fixture data", async () => {
    const { asFragment } = render(<LPDashboard />);

    await screen.findByText("LP Dashboard");
    await waitFor(() => {
      expect(screen.getByText("#1")).toBeInTheDocument();
    });

    expect(asFragment()).toMatchSnapshot();
  });

  it("matches the fund confirmation modal with sample values", async () => {
    const { asFragment } = render(<LPDashboard />);

    fireEvent.click(await screen.findByText("Fund"));

    await waitFor(() => {
      expect(screen.getByText("Fund Invoice #1")).toBeInTheDocument();
    });

    expect(asFragment()).toMatchSnapshot();
  });

  it("matches the lp portfolio style my-funded view with mixed invoice outcomes", async () => {
    const { asFragment } = render(<LPDashboard />);

    fireEvent.click(await screen.findByText("My Funded"));

    await waitFor(() => {
      expect(screen.getByText("#2")).toBeInTheDocument();
      expect(screen.getByText("#3")).toBeInTheDocument();
      expect(screen.getByText("#4")).toBeInTheDocument();
      expect(screen.getByText("#5")).toBeInTheDocument();
    });

    expect(screen.queryByText(`#${invoiceFixtures.pending.id.toString()}`)).not.toBeInTheDocument();
    expect(asFragment()).toMatchSnapshot();
  });
});
