import { Invoice } from "./soroban";

export interface LPMetrics {
  totalCapitalDeployed: bigint;
  totalYieldEarned: bigint;
  yieldLast30Days: bigint;
  avgYieldRate: number;
  defaultRate: number;
  avgSettlementTime: number | null;
  largestSingleYield: bigint;
}

export interface PayerPerformance {
  payer: string;
  totalInvoices: number;
  totalYield: bigint;
  defaultRate: number;
  fundedAmount: bigint;
}

export function calculateLPMetrics(invoices: Invoice[], address: string): LPMetrics {
  const lpInvoices = invoices.filter((i) => i.funder === address);
  if (lpInvoices.length === 0) {
    return {
      totalCapitalDeployed: 0n,
      totalYieldEarned: 0n,
      yieldLast30Days: 0n,
      avgYieldRate: 0,
      defaultRate: 0,
      avgSettlementTime: null,
      largestSingleYield: 0n,
    };
  }

  let totalCapital = 0n;
  let totalYield = 0n;
  let yield30d = 0n;
  let totalDiscountRate = 0;
  let defaultedCount = 0;
  let largestYield = 0n;
  
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

  lpInvoices.forEach((i) => {
    totalCapital += i.amount;
    // yield = amount * discount_rate (bps) / 10000
    const yieldAmount = (i.amount * BigInt(i.discount_rate)) / 10000n;
    
    if (i.status === "Paid") {
      totalYield += yieldAmount;
      if (i.funded_at && Number(i.funded_at) >= thirtyDaysAgo) {
        yield30d += yieldAmount;
      }
      if (yieldAmount > largestYield) {
        largestYield = yieldAmount;
      }
    }

    totalDiscountRate += i.discount_rate;
    if (i.status === "Defaulted") {
      defaultedCount++;
    }
  });

  return {
    totalCapitalDeployed: totalCapital,
    totalYieldEarned: totalYield,
    yieldLast30Days: yield30d,
    avgYieldRate: (totalDiscountRate / lpInvoices.length) / 100, // to %
    defaultRate: (defaultedCount / lpInvoices.length) * 100,
    avgSettlementTime: null, // Data missing in model
    largestSingleYield: largestYield,
  };
}

export function getMonthlyYieldData(invoices: Invoice[], address: string) {
  const lpInvoices = invoices.filter((i) => i.funder === address && i.status === "Paid" && i.funded_at);
  const months: Record<string, bigint> = {};
  
  lpInvoices.forEach((i) => {
    const date = new Date(Number(i.funded_at!) * 1000);
    const monthKey = date.toLocaleString("default", { month: "short", year: "2-digit" });
    const yieldAmount = (i.amount * BigInt(i.discount_rate)) / 10000n;
    months[monthKey] = (months[monthKey] || 0n) + yieldAmount;
  });

  return Object.entries(months).map(([name, yieldVal]) => ({
    name,
    yield: Number(yieldVal) / 10_000_000, // Convert to whole USDC (assuming 7 decimals, check constants)
  }));
}

export function getCapitalVsYieldData(invoices: Invoice[], address: string) {
  const lpInvoices = invoices.filter((i) => i.funder === address && i.funded_at);
  const sorted = [...lpInvoices].sort((a, b) => Number(a.funded_at!) - Number(b.funded_at!));
  
  let cumulativeCapital = 0n;
  let cumulativeYield = 0n;

  return sorted.map((i) => {
    cumulativeCapital += i.amount;
    if (i.status === "Paid") {
      cumulativeYield += (i.amount * BigInt(i.discount_rate)) / 10000n;
    }
    return {
      time: new Date(Number(i.funded_at!) * 1000).toLocaleDateString(),
      capital: Number(cumulativeCapital) / 10_000_000,
      yield: Number(cumulativeYield) / 10_000_000,
    };
  });
}

export function getOutcomeBreakdown(invoices: Invoice[], address: string) {
  const lpInvoices = invoices.filter((i) => i.funder === address);
  const counts = { Paid: 0, Defaulted: 0, Active: 0 };
  
  lpInvoices.forEach((i) => {
    if (i.status === "Paid") counts.Paid++;
    else if (i.status === "Defaulted") counts.Defaulted++;
    else if (i.status === "Funded") counts.Active++;
  });

  return [
    { name: "Paid", value: counts.Paid },
    { name: "Defaulted", value: counts.Defaulted },
    { name: "Active", value: counts.Active },
  ];
}

export function getPayerPerformance(invoices: Invoice[], address: string): PayerPerformance[] {
  const lpInvoices = invoices.filter((i) => i.funder === address);
  const payers: Record<string, { totalInvoices: number; totalYield: bigint; defaulted: number; fundedAmount: bigint }> = {};

  lpInvoices.forEach((i) => {
    if (!payers[i.payer]) {
      payers[i.payer] = { totalInvoices: 0, totalYield: 0n, defaulted: 0, fundedAmount: 0n };
    }
    payers[i.payer].totalInvoices++;
    payers[i.payer].fundedAmount += i.amount;
    
    if (i.status === "Paid") {
      payers[i.payer].totalYield += (i.amount * BigInt(i.discount_rate)) / 10000n;
    } else if (i.status === "Defaulted") {
      payers[i.payer].defaulted++;
    }
  });

  return Object.entries(payers).map(([payer, data]) => ({
    payer,
    totalInvoices: data.totalInvoices,
    totalYield: data.totalYield,
    defaultRate: (data.defaulted / data.totalInvoices) * 100,
    fundedAmount: data.fundedAmount,
  }));
}
