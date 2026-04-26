import { describe, it, expect } from "vitest";
import {
  calculateMovingAverage,
  MonthlyDefaultBucket,
} from "../../utils/defaultRate";

const mockData: MonthlyDefaultBucket[] = [
  { date: "2025-01", label: "Jan 2025", defaulted: 1, funded: 10, defaultRate: 10 },
  { date: "2025-02", label: "Feb 2025", defaulted: 0, funded: 12, defaultRate: 0 },
  { date: "2025-03", label: "Mar 2025", defaulted: 2, funded: 10, defaultRate: 20 },
  { date: "2025-04", label: "Apr 2025", defaulted: 1, funded: 15, defaultRate: 6.67 },
  { date: "2025-05", label: "May 2025", defaulted: 0, funded: 20, defaultRate: 0 },
];

describe("defaultRate utilities", () => {
  describe("calculateMovingAverage", () => {
    it("returns empty array for empty input", () => {
      expect(calculateMovingAverage([])).toEqual([]);
    });

    it("calculates moving average with window 1", () => {
      const result = calculateMovingAverage(mockData, 1);
      expect(result[0].movingAverage).toBe(10);
      expect(result[1].movingAverage).toBe(0);
      expect(result[2].movingAverage).toBe(20);
      expect(result[3].movingAverage).toBe(6.67);
      expect(result[4].movingAverage).toBe(0);
    });

    it("calculates moving average with window > 1", () => {
      const result = calculateMovingAverage(mockData, 3);
      expect(result[2].movingAverage).toBe(10);
      expect(result[3].movingAverage).toBeCloseTo(8.89, 1);
    });

    it("preserves original bucket data", () => {
      const result = calculateMovingAverage(mockData, 1);
      expect(result[0].date).toBe("2025-01");
      expect(result[0].defaulted).toBe(1);
      expect(result[0].funded).toBe(10);
    });

    it("handles single element array", () => {
      const single = [mockData[0]];
      const result = calculateMovingAverage(single, 3);
      expect(result[0].movingAverage).toBe(10);
    });

    it("rounds moving average to 2 decimal places", () => {
      const data: MonthlyDefaultBucket[] = [
        { date: "2025-01", label: "Jan 2025", defaulted: 1, funded: 3, defaultRate: 33.333 },
      ];
      const result = calculateMovingAverage(data, 1);
      expect(result[0].movingAverage).toBe(33.33);
    });
  });
});