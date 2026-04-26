Frontend: Add default rate trend chart to the analytics page

Description
The protocol's health is partly measured by its default rate if it rises sharply, something is wrong. This issue adds a default rate trend chart to the analytics page so the community can monitor protocol health over time.

Requirements and context

Chart type: line chart with two line "Default rate %" and "30-day moving average"
X-axis: monthly resolution
Y-axis: percentage (0–100%)
Threshold line at 10% (dashed red) above this is considered concerning
Hover tooltip: date, default rate for that month, moving average
Summary cards above chart: "Current default rate: X%", "All-time default rate: Y%", "Trend: ↑/↓ vs last month"
Data: Defaulted invoices / total Funded invoices per month
Key files: src/pages/Analytics.tsx, new src/components/charts/DefaultRateChart.tsx
Suggested execution

Fork and branch: git checkout -b feat/default-rate-chart
Create src/components/charts/DefaultRateChart.tsx
Calculate 30-day moving average in a pure utility function
Add threshold reference line using recharts ReferenceLine
Fetch data from indexer GET /analytics/defaults?period=12m
Write unit tests for moving average calculation
Example commit message
feat: add default rate trend chart with moving average to analytics

Acceptance criteria

 Both lines render correctly
 Threshold reference line at 10% visible
 Moving average calculation is mathematically correct
 Summary cards show correct current and all-time values
 Trend arrow accurate vs previous month
 Responsive on mobile