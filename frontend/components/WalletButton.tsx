"use client";

import { useWallet } from "../context/WalletContext";
import { formatAddress } from "../utils/format";
import { NETWORK_NAME } from "../constants";

export default function WalletButton() {
  const { address, isConnected, connect, disconnect, networkMismatch, error } = useWallet();

  if (isConnected) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${networkMismatch ? 'bg-error animate-pulse' : 'bg-green-500'}`}></span>
            <span className={`text-[10px] font-bold uppercase ${networkMismatch ? 'text-error' : 'text-primary'}`}>
              {networkMismatch ? "Wrong Network" : NETWORK_NAME}
            </span>
          </div>
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
