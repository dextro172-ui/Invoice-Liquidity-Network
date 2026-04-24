"use client";

import { useEffect, useState } from "react";
import { useApprovedTokens } from "../hooks/useApprovedTokens";
import { useWallet } from "../context/WalletContext";
import { TokenAmount } from "./TokenSelector";
import { formatAddress, formatTokenAmount } from "../utils/format";
import { NETWORK_NAME } from "../constants";
import { getTokenBalance } from "../utils/soroban";

interface WalletBalance {
  contractId: string;
  amount: bigint;
}

export default function WalletButton() {
  const { address, isConnected, connect, disconnect, networkMismatch, error } = useWallet();
  const { tokens } = useApprovedTokens();
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadBalances() {
      if (!address || !isConnected || networkMismatch || tokens.length === 0) {
        setBalances([]);
        return;
      }

      setIsLoadingBalances(true);
      try {
        const nextBalances = await Promise.all(
          tokens.map(async (token) => ({
            contractId: token.contractId,
            amount: await getTokenBalance(address, token.contractId),
          })),
        );

        if (!cancelled) {
          setBalances(nextBalances.filter((entry) => entry.amount > 0n));
        }
      } catch {
        if (!cancelled) {
          setBalances([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingBalances(false);
        }
      }
    }

    loadBalances();

    return () => {
      cancelled = true;
    };
  }, [address, isConnected, networkMismatch, tokens]);

  if (isConnected) {
    return (
      <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${networkMismatch ? 'bg-error animate-pulse' : 'bg-green-500'}`}></span>
            <span className={`text-[10px] font-bold uppercase ${networkMismatch ? 'text-error' : 'text-primary'}`}>
              {networkMismatch ? "Wrong Network" : NETWORK_NAME}
            </span>
          </div>
          {!networkMismatch ? (
            <div className="flex flex-wrap justify-end gap-2">
              {isLoadingBalances ? (
                <span className="rounded-full border border-outline-variant/15 bg-surface-container-low px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Loading balances...
                </span>
              ) : balances.length > 0 ? (
                balances.map((balance) => {
                  const token = tokens.find((item) => item.contractId === balance.contractId);
                  if (!token) return null;

                  return (
                    <span
                      key={balance.contractId}
                      className="rounded-full border border-outline-variant/15 bg-surface-container-low px-3 py-1 text-xs font-bold text-on-surface"
                    >
                      <TokenAmount amount={formatTokenAmount(balance.amount, token)} token={token} />
                    </span>
                  );
                })
              ) : (
                <span className="rounded-full border border-outline-variant/15 bg-surface-container-low px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  No token balance
                </span>
              )}
            </div>
          ) : null}
          <span className="text-xs font-mono text-on-surface-variant">{formatAddress(address!)}</span>
        </div>
        <button
          onClick={disconnect}
          className="bg-surface-variant text-on-surface-variant px-4 py-2 rounded-lg text-sm font-bold hover:bg-surface-dim transition-all active:scale-95 border border-outline-variant/10"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative group">
      <button
        onClick={connect}
        className="bg-primary text-surface-container-lowest px-6 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-primary/90 transition-all active:scale-95 duration-150 flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
        Connect Wallet
      </button>
      {error && (
        <div className="absolute top-full right-0 mt-2 p-3 bg-error-container text-on-error-container text-xs rounded-lg shadow-xl border border-error/10 w-64 z-[60] animate-in slide-in-from-top-1 duration-200">
          <p className="font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">error</span>
            Connection Error
          </p>
          <p className="mt-1 opacity-90">{error}</p>
        </div>
      )}
    </div>
  );
}
