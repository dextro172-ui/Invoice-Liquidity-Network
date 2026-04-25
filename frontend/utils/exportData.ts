export type DateRange = "all" | "90" | "365" | "custom";

export function filterByDateRange<T extends { submittedDate?: string; fundedDate?: string; settledDate?: string }>(
  data: T[],
  dateRange: DateRange,
  customStart?: Date,
  customEnd?: Date
): T[] {
  if (dateRange === "all") return data;

  const now = new Date();
  const msInDay = 24 * 60 * 60 * 1000;
  
  return data.filter(item => {
    // Determine the relevant date field for this record type
    const dateStr = item.submittedDate || item.fundedDate || item.settledDate;
    if (!dateStr) return true; // If no date, keep it
    
    const recordDate = new Date(dateStr);
    
    if (dateRange === "90") {
      return (now.getTime() - recordDate.getTime()) <= 90 * msInDay;
    }
    
    if (dateRange === "365") {
      return (now.getTime() - recordDate.getTime()) <= 365 * msInDay;
    }
    
    if (dateRange === "custom" && customStart && customEnd) {
      return recordDate >= customStart && recordDate <= customEnd;
    }
    
    return true;
  });
}

export function formatAsCSV<T extends Record<string, any>>(data: T[]): string {
  if (!data || data.length === 0) return "";
  
  const headers = Object.keys(data[0]);
  const csvRows = data.map(row => {
    return headers.map(header => {
      const val = row[header];
      if (val === null || val === undefined) return '""';
      // Escape quotes and enclose in quotes
      const strVal = String(val);
      return `"${strVal.replace(/"/g, '""')}"`;
    }).join(",");
  });
  
  return [headers.join(","), ...csvRows].join("\n");
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  if (typeof window === "undefined") return;
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCSV<T extends Record<string, any>>(data: T[], filename: string) {
  const csvContent = formatAsCSV(data);
  downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
}

export function exportToJSON<T extends Record<string, any>>(data: T[], filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, "application/json;charset=utf-8;");
}
