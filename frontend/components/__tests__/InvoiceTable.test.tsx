import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InvoiceTable, { ColumnDefinition } from "../InvoiceTable";
import React from "react";

interface MockData {
  id: string;
  name: string;
}

const mockColumns: ColumnDefinition<MockData>[] = [
  { id: "id", label: "ID", isMandatory: true, renderCell: (d) => d.id },
  { id: "name", label: "Name", renderCell: (d) => d.name },
];

const mockData: MockData[] = [{ id: "1", name: "Alpha" }, { id: "2", name: "Beta" }];

describe("InvoiceTable", () => {
  const tableId = "test_table";
  const storageKey = `iln_table_config_${tableId}`;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders data correctly", () => {
    render(<InvoiceTable tableId={tableId} data={mockData} columns={mockColumns} keyExtractor={(d) => d.id} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("persists configuration to localStorage", () => {
    const { rerender } = render(<InvoiceTable tableId={tableId} data={mockData} columns={mockColumns} keyExtractor={(d) => d.id} />);
    
    // Toggle visibility of 'name'
    fireEvent.click(screen.getByText(/Columns/i));
    const nameRow = screen.getByText("Name").closest("label");
    const checkbox = nameRow?.querySelector('input[type="checkbox"]');
    if (checkbox) fireEvent.click(checkbox);

    // Check localStorage
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    expect(saved.visibility).not.toContain("name");

    // Rerender and expect 'name' to be hidden
    rerender(<InvoiceTable tableId={tableId} data={mockData} columns={mockColumns} keyExtractor={(d) => d.id} />);
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
  });

  it("maintains independent state for different tableIds", () => {
    const tableId2 = "other_table";
    
    // Hide 'name' on table 1
    render(<InvoiceTable tableId={tableId} data={mockData} columns={mockColumns} keyExtractor={(d) => d.id} />);
    fireEvent.click(screen.getByText(/Columns/i));
    const nameRow = screen.getByText("Name").closest("label");
    const checkbox = nameRow?.querySelector('input[type="checkbox"]');
    if (checkbox) fireEvent.click(checkbox);

    // Table 2 should still show 'name'
    render(<InvoiceTable tableId={tableId2} data={mockData} columns={mockColumns} keyExtractor={(d) => d.id} />);
    const betaCells = screen.getAllByText("Beta");
    expect(betaCells.length).toBeGreaterThan(0);
  });

  it("resets to default when handleReset is called via ColumnCustomiser", () => {
    render(<InvoiceTable tableId={tableId} data={mockData} columns={mockColumns} keyExtractor={(d) => d.id} />);
    
    // Hide 'name'
    fireEvent.click(screen.getByText(/Columns/i));
    const nameRow = screen.getByText("Name").closest("label");
    const checkbox = nameRow?.querySelector('input[type="checkbox"]');
    if (checkbox) fireEvent.click(checkbox);
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();

    // Reset
    fireEvent.click(screen.getByText(/Reset to Default/i));
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });
});
