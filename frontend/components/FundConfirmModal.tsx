import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import TokenSelector, { TokenAmount } from "./TokenSelector";
import { useApprovedTokens } from "../hooks/useApprovedTokens";
import {
  buildApproveTokenTransaction,
  getTokenAllowance,
  fundInvoice,
  Invoice,
  submitSignedTransaction,
} from "../utils/soroban";
import { formatTokenAmount, formatDate, calculateYield } from "../utils/format";

type FundingStep = "approve" | "fund";

interface FundConfirmModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FundConfirmModal({ invoice, onClose, onSuccess }: FundConfirmModalProps) {
  const { address, signTx } = useWallet();
  const { addToast, updateToast } = useToast();
  const { tokens, tokenMap, defaultToken } = useApprovedTokens();
  
  const [isFunding, setIsFunding] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(true);
  const [allowance, setAllowance] = useState<bigint | null>(null);
  const [fundingError, setFundingError] = useState<string | null>(null);
  const [faqExpanded, setFaqExpanded] = useState(false);

  const selectedInvoiceToken = invoice
    ? tokenMap.get(invoice.token ?? defaultToken?.contractId ?? "") ?? defaultToken ?? null
    : null;

  const refreshAllowance = useCallback(async (inv: Invoice, walletAddress: string) => {
    setIsCheckingAllowance(true);
    setFundingError(null);

    try {
      const nextAllowance = await getTokenAllowance({
        owner: walletAddress,
        tokenId: inv.token ?? defaultToken?.contractId,
      });
      setAllowance(nextAllowance);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch token allowance.";
      setFundingError(message);
    } finally {
      setIsCheckingAllowance(false);
    }
  }, [defaultToken]);

  useEffect(() => {
    if (!invoice || !address) return;
    void refreshAllowance(invoice, address);
  }, [address, refreshAllowance, invoice]);

  if (!invoice) return null;

  const requiredAmount = invoice.amount;
  const needsApproval = allowance === null || allowance < requiredAmount;
  const currentStep: FundingStep = allowance !== null && allowance >= requiredAmount ? "fund" : "approve";

  const approveToken = async () => {
    if (!address || !selectedInvoiceToken) return;
    setIsApproving(true);
    setFundingError(null);

    const toastId = addToast({ type: "pending", title: `Approving ${selectedInvoiceToken.symbol}...` });
    try {
      const tx = await buildApproveTokenTransaction({
        owner: address,
        amount: invoice.amount,
        tokenId: selectedInvoiceToken.contractId,
      });
      const result = await submitSignedTransaction({ tx, signTx });

      updateToast(toastId, {
        type: "success",
        title: `${selectedInvoiceToken.symbol} approved`,
        message: `Allowance updated for ${formatTokenAmount(invoice.amount, selectedInvoiceToken)}.`,
        txHash: result.txHash,
      });

      setAllowance(invoice.amount);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Approval failed.";
      setFundingError(message);
      updateToast(toastId, {
        type: "error",
        title: "Approval failed",
        message,
      });
    } finally {
      setIsApproving(false);
    }
  };

  const confirmFunding = async () => {
    if (!address) return;
    setIsFunding(true);
    setFundingError(null);
    const toastId = addToast({ type: "pending", title: "Funding Invoice..." });

    try {
      const tx = await fundInvoice(address, invoice.id);
      const result = await submitSignedTransaction({ tx, signTx });

      updateToast(toastId, {
        type: "success",
        title: "Funded Successfully",
        txHash: result.txHash,
      });
      onSuccess();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      setFundingError(message);
      updateToast(toastId, {
        type: "error",
        title: "Funding Failed",
        message,
      });
    } finally {
      setIsFunding(false);
    }
  };

  const tokenSymbol = selectedInvoiceToken?.symbol ?? "USDC";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-surface-container-lowest overflow-y-auto animate-in fade-in duration-200">
      {/* Header with Step Tracker */}
      <div className="sticky top-0 bg-surface-container-low border-b border-surface-dim z-10 px-6 py-4 flex items-center justify-between">
        <h4 className="text-xl font-bold">Fund Invoice #{invoice.id.toString()}</h4>
        
        {needsApproval && (
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${currentStep === "approve" ? "text-primary" : "text-on-surface-variant line-through"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === "approve" ? "bg-primary text-surface-container-lowest" : "bg-surface-variant text-on-surface-variant"}`}>1</div>
              <span className="text-sm font-bold">Approve</span>
            </div>
            <div className="w-12 h-px bg-surface-variant"></div>
            <div className={`flex items-center gap-2 ${currentStep === "fund" ? "text-primary" : "text-on-surface-variant opacity-50"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === "fund" ? "bg-primary text-surface-container-lowest" : "bg-surface-variant text-on-surface-variant"}`}>2</div>
              <span className="text-sm font-bold">Fund</span>
            </div>
          </div>
        )}
        {!needsApproval && (
          <div className="flex items-center gap-2 text-primary">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-primary text-surface-container-lowest">✓</div>
            <span className="text-sm font-bold">Allowance Sufficient</span>
          </div>
        )}

        <button onClick={onClose} className="p-2 hover:bg-surface-variant/20 rounded-full text-on-surface-variant">
          <span className="material-symbols-outlined shrink-0">close</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-surface-container-lowest">
          
          {fundingError && (
            <div className="mb-6 rounded-xl border border-error/15 bg-error-container/70 px-4 py-3 text-sm text-on-error-container">
              {fundingError}
            </div>
          )}

          {/* STEP 1 */}
          {currentStep === "approve" && (
            <div className="animate-in slide-in-from-right-8 duration-300">
              <div className="mb-8">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold tracking-wide">1 of 2</span>
                <h2 className="text-3xl font-bold mt-4 mb-2">Approve {tokenSymbol}</h2>
                <p className="text-lg text-on-surface-variant">
                  {isCheckingAllowance 
                    ? "Checking current allowance..."
                    : `You're authorising ILN to spend ${selectedInvoiceToken ? formatTokenAmount(invoice.amount, selectedInvoiceToken) : invoice.amount.toString()} ${tokenSymbol} from your wallet. This is a one-time approval for this invoice.`}
                </p>
              </div>

              <div className="mb-8 border border-outline-variant/30 rounded-xl overflow-hidden">
                <button 
                  onClick={() => setFaqExpanded(!faqExpanded)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-surface-container-low hover:bg-surface-variant/20 transition-colors text-left"
                >
                  <span className="font-bold">Why do I need to do this?</span>
                  <span className="material-symbols-outlined">
                    {faqExpanded ? "expand_less" : "expand_more"}
                  </span>
                </button>
                {faqExpanded && (
                  <div className="px-6 py-4 bg-surface-container-lowest text-sm text-on-surface-variant border-t border-outline-variant/30">
                    Smart contracts cannot pull funds from your wallet automatically. You must first generate an approval transaction granting the ILN contract permission to transfer the Exact amount of USDC required for this invoice. 
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <button
                  disabled={isApproving || isCheckingAllowance}
                  onClick={approveToken}
                  className="px-8 py-4 rounded-xl font-bold text-lg bg-primary text-surface-container-lowest hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 w-full"
                >
                  {isApproving ? (
                    <>
                      <span className="w-5 h-5 border-2 border-surface-container-lowest border-t-transparent rounded-full animate-spin"></span>
                      Approving... (check your Freighter extension)
                    </>
                  ) : (
                    `Approve ${tokenSymbol}`
                  )}
                </button>
                <button
                  onClick={onClose}
                  disabled={isApproving}
                  className="px-8 py-4 rounded-xl font-bold text-lg border border-outline-variant hover:bg-surface-dim transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === "fund" && (
            <div className="animate-in slide-in-from-right-8 duration-300">
              <div className="mb-8">
                {needsApproval ? (
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold tracking-wide">2 of 2</span>
                ) : null}
                <h2 className="text-3xl font-bold mt-4 mb-2">Fund Invoice</h2>
                <p className="text-lg text-on-surface-variant">Review the money flow and authorize the funding transaction.</p>
              </div>

              <div className="bg-surface-container-low rounded-2xl p-6 mb-8 border border-outline-variant/20 space-y-4">
                <div className="flex justify-between text-base">
                  <span className="text-on-surface-variant">You will send:</span>
                  <span className="font-bold text-xl">
                    {selectedInvoiceToken ? (
                      <TokenAmount amount={formatTokenAmount(invoice.amount, selectedInvoiceToken)} token={selectedInvoiceToken} />
                    ) : null}
                  </span>
                </div>
                <div className="h-px bg-surface-dim"></div>
                
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>Freelancer receives immediately:</span>
                  <span className="text-base">
                    {selectedInvoiceToken ? (
                      <TokenAmount
                        amount={formatTokenAmount(invoice.amount - calculateYield(invoice.amount, invoice.discount_rate), selectedInvoiceToken)}
                        token={selectedInvoiceToken}
                      />
                    ) : null}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">You receive on settlement:</span>
                  <span className="text-base font-bold">
                    {selectedInvoiceToken ? (
                      <TokenAmount amount={formatTokenAmount(invoice.amount, selectedInvoiceToken)} token={selectedInvoiceToken} />
                    ) : null}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm border-t border-surface-dim pt-4">
                  <span className="text-on-surface-variant">Your yield (discount):</span>
                  <span className="font-bold text-green-600 text-base">
                    {selectedInvoiceToken ? (
                      <div className="flex items-center gap-2">
                        <span>{formatTokenAmount(calculateYield(invoice.amount, invoice.discount_rate), selectedInvoiceToken)} {selectedInvoiceToken.symbol}</span>
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">{(invoice.discount_rate / 100).toFixed(2)}%</span>
                      </div>
                    ) : null}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  disabled={isFunding}
                  onClick={confirmFunding}
                  className="px-8 py-4 rounded-xl font-bold text-lg bg-primary text-surface-container-lowest hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 w-full"
                >
                  {isFunding ? (
                    <>
                      <span className="w-5 h-5 border-2 border-surface-container-lowest border-t-transparent rounded-full animate-spin"></span>
                      Funding invoice...
                    </>
                  ) : (
                    "Fund Invoice"
                  )}
                </button>
                <button
                  onClick={onClose}
                  disabled={isFunding}
                  className="px-8 py-4 rounded-xl font-bold text-lg border border-outline-variant hover:bg-surface-dim transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
