import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ColumnCustomiser, { ColumnConfig } from "../ColumnCustomiser";
import React from "react";

const mockColumns: ColumnConfig[] = [
  { id: "id", label: "ID", isMandatory: true },
  { id: "amount", label: "Amount" },
  { id: "date", label: "Date" },
];

describe("ColumnCustomiser", () => {
  const defaultProps = {
    allColumns: mockColumns,
    visibleColumns: ["id", "amount"],
    columnOrder: ["id", "amount", "date"],
    onVisibilityChange: vi.fn(),
    onOrderChange: vi.fn(),
    onReset: vi.fn(),
  };

  it("renders the columns button", () => {
    render(<ColumnCustomiser {...defaultProps} />);
    expect(screen.getByText(/Columns/i)).toBeInTheDocument();
  });

  it("opens the dropdown on click", () => {
    render(<ColumnCustomiser {...defaultProps} />);
    fireEvent.click(screen.getByText(/Columns/i));
    expect(screen.getByText(/Table Columns/i)).toBeInTheDocument();
    expect(screen.getByText(/Amount/i)).toBeInTheDocument();
  });

  it("cannot toggle mandatory columns", () => {
    render(<ColumnCustomiser {...defaultProps} />);
    fireEvent.click(screen.getByText(/Columns/i));
    
    // Find the ID checkbox
    const idRow = screen.getByText("ID").closest("div");
    const checkbox = idRow?.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeDisabled();
  });

  it("calls onVisibilityChange when a non-mandatory column is toggled", () => {
    render(<ColumnCustomiser {...defaultProps} />);
    fireEvent.click(screen.getByText(/Columns/i));
    
    const amountRow = screen.getByText("Amount").closest("label");
    const checkbox = amountRow?.querySelector('input[type="checkbox"]');
    if (checkbox) fireEvent.click(checkbox);
    
    expect(defaultProps.onVisibilityChange).toHaveBeenCalledWith("amount", false);
  });

  it("calls onReset when reset button is clicked", () => {
    render(<ColumnCustomiser {...defaultProps} />);
    fireEvent.click(screen.getByText(/Columns/i));
    
    fireEvent.click(screen.getByText(/Reset to Default/i));
    expect(defaultProps.onReset).toHaveBeenCalled();
  });
});
