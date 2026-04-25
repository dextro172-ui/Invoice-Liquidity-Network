"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CHART_TICK_STYLE = {
  fill: "#64748b",
  fontSize: 11,
};

const COLORS = ["#0ea5e9", "#ef4444", "#fbbf24"];

export const YieldBarChart = ({ data }: { data: any[] }) => (
  <div className="h-[300px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
        />
        <Bar dataKey="yield" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Yield (USDC)" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const CapitalLineChart = ({ data }: { data: any[] }) => (
  <div className="h-[300px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="time" tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
        />
        <Legend />
        <Line type="monotone" dataKey="capital" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Capital Deployed" />
        <Line type="monotone" dataKey="yield" stroke="#10b981" strokeWidth={2} dot={false} name="Yield Earned" />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export const OutcomePieChart = ({ data }: { data: any[] }) => (
  <div className="h-[300px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </div>
);
