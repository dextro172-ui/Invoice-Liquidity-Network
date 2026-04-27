import { render, screen, fireEvent } from "@testing-library/react";
import YieldCalculator from "../YieldCalculator";

describe("YieldCalculator", () => {
  const onFindMatching = jest.fn();

  beforeEach(() => {
    render(<YieldCalculator onFindMatching={onFindMatching} />);
    onFindMatching.mockClear();
  });

  test("renders initial values", () => {
    expect(screen.getByText("You send:")).toBeInTheDocument();
    expect(screen.getByText("1,000 USDC")).toBeInTheDocument();
    expect(screen.getByText("Freelancer receives:")).toBeInTheDocument();
    expect(screen.getByText("900 USDC")).toBeInTheDocument(); // 1000 - (1000 * 100 / 10000) = 900
    expect(screen.getByText("Your yield:")).toBeInTheDocument();
    expect(screen.getByText("10 USDC")).toBeInTheDocument(); // 1000 * 100 / 10000 = 10
    expect(screen.getByText("Annualised yield (APY):")).toBeInTheDocument();
    expect(screen.getByText("121.67%")).toBeInTheDocument(); // (100/100) * (365/30) * 100 = 121.67
  });

  test("updates values when amount changes", () => {
    const amountInput = screen.getByLabelText(/Invoice Amount \(USDC\)/i)
      .parentElement?.querySelector("input[type=number]");
    if (!amountInput) throw new Error("Amount input not found");
    
    fireEvent.change(amountInput, { target: { value: "2000" } });
    
    expect(screen.getByText("You send:")).toBeInTheDocument();
    expect(screen.getByText("2,000 USDC")).toBeInTheDocument();
    expect(screen.getByText("Freelancer receives:")).toBeInTheDocument();
    expect(screen.getByText("1,800 USDC")).toBeInTheDocument(); // 2000 - (2000 * 100 / 10000) = 1800
    expect(screen.getByText("Your yield:")).toBeInTheDocument();
    expect(screen.getByText("200 USDC")).toBeInTheDocument(); // 2000 * 100 / 10000 = 200
    expect(screen.getByText("Annualised yield (APY):")).toBeInTheDocument();
    expect(screen.getByText("121.67%")).toBeInTheDocument(); // APY unchanged because discount rate and settlement days same
  });

  test("updates values when discount rate changes", () => {
    const discountInput = screen.getByLabelText(/Discount Rate \(bps\)/i)
      .parentElement?.querySelector("input[type=number]");
    if (!discountInput) throw new Error("Discount input not found");
    
    fireEvent.change(discountInput, { target: { value: "200" } });
    
    expect(screen.getByText("You send:")).toBeInTheDocument();
    expect(screen.getByText("1,000 USDC")).toBeInTheDocument();
    expect(screen.getByText("Freelancer receives:")).toBeInTheDocument();
    expect(screen.getByText("800 USDC")).toBeInTheDocument(); // 1000 - (1000 * 200 / 10000) = 800
    expect(screen.getByText("Your yield:")).toBeInTheDocument();
    expect(screen.getByText("200 USDC")).toBeInTheDocument(); // 1000 * 200 / 10000 = 200
    expect(screen.getByText("Annualised yield (APY):")).toBeInTheDocument();
    expect(screen.getByText("243.33%")).toBeInTheDocument()); // (200/100) * (365/30) * 100 = 243.33
  });

  test("updates values when settlement days changes", () => {
    const daysInput = screen.getByLabelText(/Expected Settlement \(days\)/i)
      .parentElement?.querySelector("input[type=number]");
    if (!daysInput) throw new Error("Days input not found");
    
    fireEvent.change(daysInput, { target: { value: "60" } });
    
    expect(screen.getByText("Annualised yield (APY):")).toBeInTheDocument();
    expect(screen.getByText("60.84%")).toBeInTheDocument()); // (100/100) * (365/60) * 100 = 60.833... ~ 60.84
  });

  test("calls onFindMatching when button clicked", () => {
    const button = screen.getByRole("button", { name: /find invoices matching these terms/i });
    fireEvent.click(button);
    
    expect(onFindMatching).toHaveBeenCalledTimes(1);
    // Amount is 1000 USDC = 1000 * 1_000_000 = 1_000_000_000n (bigint)
    expect(onFindMatching).toHaveBeenCalledWith(
      BigInt(1000 * 1_000_000),
      100
    );
  });

  test("toggles collapse/expand", () => {
    const header = screen.getByRole("heading", { name: /what's my yield?/i });
    expect(header).toBeInTheDocument();
    
    // Initially expanded (collapsed = false)
    expect(screen.getByText("Invoice Amount (USDC)")).toBeInTheDocument();
    
    fireEvent.click(header);
    // Should now be collapsed
    expect(screen.queryByText("Invoice Amount (USDC)")).not.toBeInTheDocument();
    
    fireEvent.click(header);
    // Should be expanded again
    expect(screen.getByText("Invoice Amount (USDC)")).toBeInTheDocument();
  });
});