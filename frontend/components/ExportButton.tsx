"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import { exportToCSV, exportToJSON, filterByDateRange, DateRange } from "../utils/exportData";

interface ExportButtonProps<T extends Record<string, any>> {
  data: T[];
  filenamePrefix: string;
}

export function ExportButton<T extends Record<string, any>>({ data, filenamePrefix }: ExportButtonProps<T>) {
  const [range, setRange] = useState<DateRange>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const handleExport = (format: "csv" | "json") => {
    const customStart = startDate ? new Date(startDate) : undefined;
    const customEnd = endDate ? new Date(endDate) : undefined;
    
    const filtered = filterByDateRange(data, range, customStart, customEnd);
    
    // YYYY-MM-DD
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `${filenamePrefix}-${dateStr}.${format}`;
    
    if (format === "csv") exportToCSV(filtered, filename);
    else exportToJSON(filtered, filename);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
      <select
        className="bg-zinc-800 text-zinc-200 border-zinc-700 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-teal-500"
        value={range}
        onChange={(e) => setRange(e.target.value as DateRange)}
      >
        <option value="all">All time</option>
        <option value="90">Last 90 days</option>
        <option value="365">Last year</option>
        <option value="custom">Custom range</option>
      </select>

      {range === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="bg-zinc-800 text-zinc-200 border-zinc-700 rounded-md px-2 py-1 text-sm outline-none"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-zinc-500 text-sm">to</span>
          <input
            type="date"
            className="bg-zinc-800 text-zinc-200 border-zinc-700 rounded-md px-2 py-1 text-sm outline-none"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      )}

      <div className="h-6 w-px bg-zinc-700 mx-1"></div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleExport("csv")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-md transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> CSV
        </button>
        <button
          onClick={() => handleExport("json")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-md transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> JSON
        </button>
      </div>
    </div>
  );
}
