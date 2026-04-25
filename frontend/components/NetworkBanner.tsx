"use client";

import React, { useEffect, useState } from "react";
import { CONTRACT_ID } from "../constants";

type NetworkType = "testnet" | "mainnet" | "maintenance";

export default function NetworkBanner() {
  const [visible, setVisible] = useState(false);
  
  const network = (process.env.NEXT_PUBLIC_NETWORK || "testnet") as NetworkType;
  const mainnetUrl = process.env.NEXT_PUBLIC_MAINNET_URL || "#";

  useEffect(() => {
    // Check session storage for dismissal
    const isDismissed = sessionStorage.getItem("network_banner_dismissed");
    if (!isDismissed) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem("network_banner_dismissed", "true");
  };

  if (!visible) return null;

  const getBannerConfig = () => {
    switch (network) {
      case "mainnet":
        return {
          bg: "bg-emerald-500",
          textColor: "text-white",
          icon: "check_circle",
          content: (
            <>
              ILN is live on Stellar Mainnet. Contract:{" "}
              <a
                href={`https://stellar.expert/explorer/public/contract/${CONTRACT_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline underline-offset-4 hover:opacity-80"
              >
                {CONTRACT_ID.slice(0, 8)}...{CONTRACT_ID.slice(-4)} ↗
              </a>
            </>
          ),
        };
      case "maintenance":
        return {
          bg: "bg-red-500",
          textColor: "text-white",
          icon: "construction",
          content: "ILN is undergoing maintenance. Read-only mode active.",
        };
      case "testnet":
      default:
        return {
          bg: "bg-amber-400",
          textColor: "text-on-surface",
          icon: "info",
          content: (
            <>
              You are using ILN on Stellar Testnet. Funds are not real.{" "}
              <a
                href={mainnetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline underline-offset-4 hover:opacity-80"
              >
                Switch to Mainnet ↗
              </a>
            </>
          ),
        };
    }
  };

  const config = getBannerConfig();

  return (
    <div className={`w-full ${config.bg} ${config.textColor} px-4 py-2.5 sticky top-20 z-40 shadow-sm border-b border-black/5`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
            {config.icon}
          </span>
          <p className="text-sm font-medium leading-tight">
            {config.content}
          </p>
        </div>
        
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-black/10 rounded-full transition-colors shrink-0"
          aria-label="Dismiss banner"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  );
}
