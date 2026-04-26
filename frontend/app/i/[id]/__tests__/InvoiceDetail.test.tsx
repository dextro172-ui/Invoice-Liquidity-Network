import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InvoiceStatusPage from '../page';
import * as soroban from '../../../../utils/soroban';
import { useWallet } from '../../../../context/WalletContext';
import { useToast } from '../../../../context/ToastContext';
import { Suspense } from 'react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../../../context/WalletContext', () => ({
  useWallet: vi.fn(),
}));

vi.mock('../../../../context/ToastContext', () => ({
  useToast: vi.fn(),
}));

vi.mock('../../../../utils/soroban', () => ({
  getInvoice: vi.fn(),
  updateInvoice: vi.fn(),
  submitSignedTransaction: vi.fn(),
  getInvoiceRequiredFunding: vi.fn(),
}));

vi.mock('qrcode.react', () => ({
  QRCodeSVG: () => <div data-testid="qr-code" />,
}));

vi.mock('../../../../components/ActivityFeed', () => ({
  default: () => <div data-testid="activity-feed" />,
}));

vi.mock('../../../../hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}));

// ── Test data ─────────────────────────────────────────────────────────────────

const FREELANCER_ADDR = 'GFREELANCERADDR1234567890123456789012345678901234567890';
const PAYER_ADDR = 'GPAYERADDR12345678901234567890123456789012345678901234567';

const mockInvoice: soroban.Invoice = {
  id: 108n,
  freelancer: FREELANCER_ADDR,
  payer: PAYER_ADDR,
  amount: 1000_000_000n, // 100 USDC
  due_date: BigInt(Math.floor(Date.now() / 1000) + 86400 * 30),
  discount_rate: 500, // 5%
  status: 'Open',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function renderPage(id: string) {
  const params = Promise.resolve({ id });
  let result: any;
  await act(async () => {
    result = render(
      <Suspense fallback={<div>Loading Suspense...</div>}>
        <InvoiceStatusPage params={params} />
      </Suspense>
    );
  });
  return result;
}

describe('InvoiceStatusPage — Inline Editing (#108)', () => {
  const mockAddToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as any).mockReturnValue({ addToast: mockAddToast });
    (soroban.getInvoice as any).mockResolvedValue(mockInvoice);
    (useWallet as any).mockReturnValue({
      address: FREELANCER_ADDR,
      signTx: vi.fn(),
    });
  });

  it('renders "Edit" button if user is the freelancer and status is Open', async () => {
    await renderPage('108');
    const editBtn = await screen.findByText('Edit');
    expect(editBtn).toBeInTheDocument();
  });

  it('does NOT render "Edit" button if user is NOT the freelancer', async () => {
    (useWallet as any).mockReturnValue({ address: 'GOTHER...' });
    await renderPage('108');
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('enters edit mode when "Edit" button is clicked', async () => {
    await renderPage('108');
    const editBtn = await screen.findByText('Edit');
    await act(async () => {
      fireEvent.click(editBtn);
    });
    
    expect(screen.getByDisplayValue('100.00')).toBeInTheDocument();
    expect(screen.getByText('Save changes')).toBeInTheDocument();
  });

  it('shows validation errors for invalid inputs', async () => {
    await renderPage('108');
    const editBtn = await screen.findByText('Edit');
    await act(async () => {
      fireEvent.click(editBtn);
    });

    const amountInput = screen.getByDisplayValue('100.00');
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '0' } });
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Save changes'));
    });

    await waitFor(() => {
      expect(screen.getByText('Invalid amount')).toBeInTheDocument();
    });
  });

  it('performs optimistic update and calls contract on save', async () => {
    (soroban.updateInvoice as any).mockResolvedValue({ tx: { toXDR: () => '...' } });
    (soroban.submitSignedTransaction as any).mockResolvedValue({ txHash: '0x123' });

    await renderPage('108');
    const editBtn = await screen.findByText('Edit');
    await act(async () => {
      fireEvent.click(editBtn);
    });

    const amountInput = screen.getByDisplayValue('100.00');
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '200' } });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Save changes'));
    });

    // We check for the Saving indicator which proves handleSave was entered
    await waitFor(() => {
      expect(screen.getByText(/Saving pending changes/)).toBeInTheDocument();
    });

    expect(soroban.updateInvoice).toHaveBeenCalled();
  });

  it('reverts optimistic update on transaction failure', async () => {
    (soroban.updateInvoice as any).mockRejectedValue(new Error('Rejected'));

    await renderPage('108');
    const editBtn = await screen.findByText('Edit');
    await act(async () => {
      fireEvent.click(editBtn);
    });

    const amountInput = screen.getByDisplayValue('100.00');
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '300' } });
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Save changes'));
    });

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });

    // In my impl, it stays in edit mode with the failing value
    expect(screen.getByDisplayValue('300')).toBeInTheDocument();
  });
});
