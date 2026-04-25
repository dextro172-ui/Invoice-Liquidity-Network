import { describe, it, expect } from "vitest";
import { formatAsCSV, filterByDateRange } from "../utils/exportData";

describe("exportData Utils", () => {
  describe("formatAsCSV", () => {
    it("handles empty array", () => {
      expect(formatAsCSV([])).toBe("");
    });

    it("formats standard homogeneous objects", () => {
      const data = [
        { id: 1, name: "Alice", status: "funded" },
        { id: 2, name: "Bob", status: "pending" }
      ];
      
      const expected = `id,name,status\n"1","Alice","funded"\n"2","Bob","pending"`;
      expect(formatAsCSV(data)).toBe(expected);
    });

    it("escapes quotes in values correctly", () => {
      const data = [
        { id: 1, description: 'Project "Alpha"', amount: 500 }
      ];
      
      const expected = `id,description,amount\n"1","Project ""Alpha""","500"`;
      expect(formatAsCSV(data)).toBe(expected);
    });
  });

  describe("filterByDateRange", () => {
    it("returns all data when range is 'all'", () => {
      const data = [{ id: 1 }];
      expect(filterByDateRange(data as any, "all")).toEqual(data);
    });
  });
});
