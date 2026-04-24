import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SubmitInvoiceForm from "../components/SubmitInvoiceForm";

const addToast = vi.fn(() => "toast-id");
const updateToast = vi.fn();
const submitInvoiceTransaction = vi.fn();

const walletState = {
  address: null as string | null,
  isConnected: false,
  isInstalled: true,
  error: null as string | null,
  networkMismatch: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  signTx: vi.fn(),
};

vi.mock("../context/ToastContext", () => ({
  useToast: () => ({
    addToast,
    updateToast,
  }),
}));

vi.mock("../context/WalletContext", () => ({
  useWallet: () => walletState,
}));

vi.mock("../utils/soroban", () => ({
  submitInvoiceTransaction: (...args: unknown[]) => submitInvoiceTransaction(...args),
}));

describe("SubmitInvoiceForm", () => {
  beforeEach(() => {
    walletState.address = null;
    walletState.isConnected = false;
    walletState.error = null;
    walletState.networkMismatch = false;
    walletState.connect.mockReset();
    walletState.disconnect.mockReset();
    walletState.signTx.mockReset();
    addToast.mockClear();
    updateToast.mockClear();
    submitInvoiceTransaction.mockReset();
  });

  it("updates the live yield preview as the user types", () => {
    render(<SubmitInvoiceForm />);

    fireEvent.change(screen.getByPlaceholderText("5000.00"), {
      target: { value: "5000" },
    });
    fireEvent.change(screen.getByPlaceholderText("3.00"), {
      target: { value: "4.5" },
    });

    expect(screen.getByText("Live yield preview")).toBeInTheDocument();
    expect(screen.getByText("$5,000.00")).toBeInTheDocument();
    expect(screen.getByText("$4,775.00")).toBeInTheDocument();
    expect(screen.getByText("$225.00")).toBeInTheDocument();
  });

  it("shows a wallet error before submitting when Freighter is not connected", async () => {
    render(<SubmitInvoiceForm />);

    fireEvent.click(screen.getByText("Submit invoice"));

    expect(await screen.findByText("Connect your Freighter wallet to submit an invoice.")).toBeInTheDocument();
    expect(submitInvoiceTransaction).not.toHaveBeenCalled();
  });

  it("submits an invoice and displays the returned invoice id", async () => {
    walletState.address = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
    walletState.isConnected = true;

    submitInvoiceTransaction.mockResolvedValue({
      invoiceId: 42n,
      txHash: "abc123",
    });

    render(<SubmitInvoiceForm />);

    fireEvent.change(screen.getByPlaceholderText("G..."), {
      target: { value: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF" },
    });
    fireEvent.change(screen.getByPlaceholderText("5000.00"), {
      target: { value: "1500" },
    });
    fireEvent.change(screen.getByDisplayValue("3.00"), {
      target: { value: "2.5" },
    });
    fireEvent.change(screen.getByLabelText("Due date"), {
      target: { value: "2099-01-02" },
    });
    fireEvent.click(screen.getByText("Submit invoice"));

    await waitFor(() => {
        expect(submitInvoiceTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            freelancer: walletState.address,
            payer: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
            amount: 15000000000n,
            discountRate: 250,
          }),
        );
    });

    expect(await screen.findByText("Returned invoice ID")).toBeInTheDocument();
    expect(screen.getByText("#42")).toBeInTheDocument();
    expect(screen.getByText(/Transaction hash: abc123/)).toBeInTheDocument();
  });
});
