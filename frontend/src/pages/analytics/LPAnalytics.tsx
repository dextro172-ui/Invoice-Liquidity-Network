"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useWallet } from "../../context/WalletContext";
import { getAllInvoices, Invoice } from "../../utils/soroban";
import { formatUSDC } from "../../utils/format";
import {
  calculateLPMetrics,
  getMonthlyYieldData,
  getCapitalVsYieldData,
  getOutcomeBreakdown,
  getPayerPerformance,
} from "../../utils/lp-analytics";
import MetricCard from "../../components/analytics/MetricCard";
import { YieldBarChart, CapitalLineChart, OutcomePieChart } from "../../components/analytics/LPCharts";
import PayerPerformanceTable from "../../components/analytics/PayerPerformanceTable";

const LPAnalyticsPage = () => {
  const { address, isConnected, connect } = useWallet();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const all = await getAllInvoices();
      setInvoices(all);
    } catch (error) {
      console.error("Failed to fetch invoices", error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const metrics = useMemo(() => calculateLPMetrics(invoices, address || ""), [invoices, address]);
  const monthlyData = useMemo(() => getMonthlyYieldData(invoices, address || ""), [invoices, address]);
  const timeSeriesData = useMemo(() => getCapitalVsYieldData(invoices, address || ""), [invoices, address]);
  const outcomeData = useMemo(() => getOutcomeBreakdown(invoices, address || ""), [invoices, address]);
  const payerData = useMemo(() => getPayerPerformance(invoices, address || ""), [invoices, address]);

  const hasData = invoices.some((i) => i.funder === address);

  return (
    <main className="min-h-screen bg-surface-container-lowest">
      <Navbar />
      
      {/* Header Section */}
      <section className="pt-32 pb-10 px-6 md:px-8 border-b border-outline-variant/10 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Liquidity Provider</p>
            <h1 className="text-3xl md:text-5xl font-headline font-bold">LP Performance Analytics</h1>
            <p className="text-on-surface-variant mt-2 max-w-2xl">
              Track your capital deployment, yield performance, and risk metrics in real-time based on your funded invoice history.
            </p>
          </div>
          {!isConnected && (
             <button
                onClick={connect}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                Connect Wallet to View
              </button>
          )}
        </div>
      </section>

      {!isConnected ? (
        <section className="py-20 text-center">
             <div className="max-w-md mx-auto px-6">
                <span className="material-symbols-outlined text-6xl text-outline-variant/40 mb-4">account_balance_wallet</span>
                <h2 className="text-2xl font-bold mb-2">Wallet Not Connected</h2>
                <p className="text-on-surface-variant mb-8 text-sm">Please connect your wallet to access your personalized LP performance analytics and portfolio insights.</p>
                <button
                  onClick={connect}
                  className="rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-primary/90"
                >
                  Connect Wallet
                </button>
             </div>
        </section>
      ) : loading ? (
        <section className="py-20 text-center">
            <div className="flex flex-col items-center gap-4">
               <div className="h-10 w-10 animate-spin rounded-full border-4 border-outline-variant/20 border-t-primary" />
               <p className="text-sm font-medium text-on-surface-variant">Analyzing your portfolio...</p>
            </div>
        </section>
      ) : !hasData ? (
        <section className="py-20 text-center">
             <div className="max-w-md mx-auto px-6">
                <span className="material-symbols-outlined text-6xl text-outline-variant/40 mb-4">analytics</span>
                <h2 className="text-2xl font-bold mb-2">No Funding History</h2>
                <p className="text-on-surface-variant mb-8 text-sm">It looks like you haven't funded any invoices yet. Once you fund your first invoice, your performance metrics will appear here.</p>
                <a
                  href="/lp/discovery"
                  className="rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-primary/90"
                >
                  Explore Invoices
                </a>
             </div>
        </section>
      ) : (
        <section className="px-6 md:px-8 py-10">
          <div className="max-w-7xl mx-auto space-y-12">
            
            {/* KPI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard 
                    id="total-capital" 
                    icon="savings" 
                    label="Total Capital Deployed" 
                    value={formatUSDC(metrics.totalCapitalDeployed)} 
                    sub="Cumulative principal funded"
                />
                <MetricCard 
                    id="total-yield" 
                    icon="trending_up" 
                    label="Total Yield Earned" 
                    value={formatUSDC(metrics.totalYieldEarned)} 
                    sub="Realized profit from paid invoices"
                    accent
                />
                <MetricCard 
                    id="avg-yield" 
                    icon="percent" 
                    label="Avg Yield Rate" 
                    value={`${metrics.avgYieldRate.toFixed(2)}%`} 
                    sub="Average discount rate on portfolio"
                />
                <MetricCard 
                    id="default-rate" 
                    icon="report_problem" 
                    label="Portfolio Default Rate" 
                    value={`${metrics.defaultRate.toFixed(1)}%`} 
                    sub="Based on total funded invoices"
                    accent={metrics.defaultRate > 5}
                />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard 
                    id="yield-30d" 
                    icon="calendar_today" 
                    label="Yield (Last 30 Days)" 
                    value={formatUSDC(metrics.yieldLast30Days)} 
                />
                <MetricCard 
                    id="largest-yield" 
                    icon="military_tech" 
                    label="Largest Single Yield" 
                    value={formatUSDC(metrics.largestSingleYield)} 
                />
                <MetricCard 
                    id="avg-time" 
                    icon="speed" 
                    label="Avg. Settlement Time" 
                    value={metrics.avgSettlementTime !== null ? `${metrics.avgSettlementTime} days` : "N/A"} 
                    sub="Data tracking pending"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="rounded-[24px] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
                    <h3 className="font-headline font-bold mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">bar_chart</span>
                        Monthly Yield Earned
                    </h3>
                    <YieldBarChart data={monthlyData} />
                </div>
                <div className="rounded-[24px] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
                    <h3 className="font-headline font-bold mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">pie_chart</span>
                        Invoice Outcome Breakdown
                    </h3>
                    <OutcomePieChart data={outcomeData} />
                </div>
                <div className="lg:col-span-2 rounded-[24px] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
                    <h3 className="font-headline font-bold mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">show_chart</span>
                        Growth: Capital vs Yield Over Time
                    </h3>
                    <CapitalLineChart data={timeSeriesData} />
                </div>
            </div>

            {/* Table Section */}
            <PayerPerformanceTable data={payerData} />

          </div>
        </section>
      )}

      <Footer />
    </main>
  );
};

export default LPAnalyticsPage;
