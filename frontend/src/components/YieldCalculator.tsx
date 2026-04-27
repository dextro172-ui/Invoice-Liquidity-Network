"use client";

import React, { useState, useCallback } from "react";
import { formatUSDC, calculateYield } from "../utils/format";

interface YieldCalculatorProps {
  onFindMatching: (amount: bigint, discountRate: number) => void;
}

export default function YieldCalculator({ onFindMatching }: YieldCalculatorProps) {
  const [amount, setAmount] = useState<number>(1000); // USDC
  const [discountRate, setDiscountRate] = useState<number>(100); // bps
  const [settlementDays, setSettlementDays] = useState<number>(30); // days

  const [collapsed, setCollapsed] = useState<boolean>(false);

  // Calculate derived values
  const amountBigInt = BigInt(amount * 1_000_000); // Convert USDC to smallest unit (7 decimals)
  const discountAmount = calculateYield(amountBigInt, discountRate);
  const freelancerReceives = amountBigInt - discountAmount;
  const apy =
    discountRate > 0 && settlementDays > 0
      ? ((discountRate / 100) * (365 / settlementDays)) * 100
      : 0;

  const handleFindMatching = useCallback(() => {
    onFindMatching(amountBigInt, discountRate);
  }, [amountBigInt, discountRate]);

  return (
    <div className="border border-surface-dim rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-surface-container-low cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
        <h3 className="text-lg font-medium flex items-center gap-2">
          <span className="material-symbols-outlined">calculate</span>
          What's my yield?
        </h3>
        <span className="material-symbols-outlined transition-transform duration-200">
          {collapsed ? "expand_more" : "expand_less"}
        </span>
      </div>
      
      {!collapsed && (
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm font-medium text-on-surface-variant">
              Invoice Amount (USDC)
              <span>{amount}</span>
            </label>
            <div className="flex w-full space-x-2">
              <input
                type="range"
                min={100}
                max={10000}
                step={100}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="flex-1 h-2 bg-primary/20 rounded"
              />
              <input
                type="number"
                min={100}
                max={10000}
                step={100}
                value={amount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) setAmount(val);
                }}
                className="w-20 text-center border border-surface-dim rounded px-2"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm font-medium text-on-surface-variant">
              Discount Rate (bps)
              <span>{discountRate}</span>
            </label>
            <div className="flex w-full space-x-2">
              <input
                type="range"
                min={1}
                max={5000}
                step={1}
                value={discountRate}
                onChange={(e) => setDiscountRate(Number(e.target.value))}
                className="flex-1 h-2 bg-primary/20 rounded"
              />
              <input
                type="number"
                min={1}
                max={5000}
                step={1}
                value={discountRate}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) setDiscountRate(val);
                }}
                className="w-20 text-center border border-surface-dim rounded px-2"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm font-medium text-on-surface-variant">
              Expected Settlement (days)
              <span>{settlementDays}</span>
            </label>
            <div className="flex w-full space-x-2">
              <input
                type="range"
                min={1}
                max={90}
                step={1}
                value={settlementDays}
                onChange={(e) => setSettlementDays(Number(e.target.value))}
                className="flex-1 h-2 bg-primary/20 rounded"
              />
              <input
                type="number"
                min={1}
                max={90}
                step={1}
                value={settlementDays}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) setSettlementDays(val);
                }}
                className="w-20 text-center border border-surface-dim rounded px-2"
              />
            </div>
          </div>
          
          <div className="border-t border-surface-dim pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>You send:</span>
                <span className="font-mono">{formatUSDC(amountBigInt)}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Freelancer receives:</span>
                <span className="font-mono text-green-600">{formatUSDC(freelancerReceives)}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Your yield:</span>
                <span className="font-mono text-green-600">{formatUSDC(discountAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Annualised yield (APY):</span>
                <span className="font-mono text-green-600">{apy.toFixed(2)}%</span>
              </div>
              <div className="text-xs text-on-surface-variant mt-1">
                Compared to: ~5% savings account / ~8% typical DeFi
              </div>
            </div>
            
            <button
              onClick={handleFindMatching}
              className="w-full mt-4 bg-primary text-surface-container-lowest text-xs font-bold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Find invoices matching these terms
            </button>
          </div>
        </div>
      )}
    </div>
  );
}