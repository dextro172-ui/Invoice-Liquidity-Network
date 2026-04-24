import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PayInvoicePage from '../page';
import * as soroban from '../../../../utils/soroban';
import { useWallet } from '../../../../context/WalletContext';
import { useToast } from '../../../../context/ToastContext';

// Mock context and utils
vi.mock('../../../../context/WalletContext', () => ({
  useWallet: vi.fn(),
}));

vi.mock('../../../../context/ToastContext', () => ({
  useToast: vi.fn(),
}));

vi.mock('../../../../utils/soroban', () => ({
  getInvoice: vi.fn(),
  markPaid: vi.fn(),
  submitSignedTransaction: vi.fn(),
}));

describe('PayInvoicePage', () => {
  const mockInvoice = {
    id: 1n,
    freelancer: 'GFREELANCER',
    payer: 'GPAYER',
    amount: 1000000000n,
    due_date: 1713960000n,
    status: 'Funded',
  };

  const mockToast = {
    addToast: vi.fn().mockReturnValue('toast-id'),
    updateToast: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as any).mockReturnValue(mockToast);
    (soroban.getInvoice as any).mockResolvedValue(mockInvoice);
  });

  it('should render invoice summary without wallet connection', async () => {
    (useWallet as any).mockReturnValue({
      address: null,
      connect: vi.fn(),
    });

    render(<PayInvoicePage params={{ id: '1' }} />);

    await waitFor(() => {
      expect(screen.getByText(/100.00 USDC/)).toBeInTheDocument();
      expect(screen.getByText('Connect Wallet and Pay')).toBeInTheDocument();
    });
  });

  it('should show warning if connected wallet is not the payer', async () => {
    (useWallet as any).mockReturnValue({
      address: 'GWRONGWALLET',
      connect: vi.fn(),
    });

    render(<PayInvoicePage params={{ id: '1' }} />);

    await waitFor(() => {
      expect(screen.getByText('Address Mismatch')).toBeInTheDocument();
      expect(screen.getByText('Restricted to Registered Payer')).toBeInTheDocument();
    });
  });

  it('should show confirmation if invoice is already paid', async () => {
    (soroban.getInvoice as any).mockResolvedValue({
      ...mockInvoice,
      status: 'Paid',
    });

    (useWallet as any).mockReturnValue({
      address: 'GPAYER',
    });

    render(<PayInvoicePage params={{ id: '1' }} />);

    await waitFor(() => {
      expect(screen.getByText('Invoice settled')).toBeInTheDocument();
      expect(screen.getByText('Settlement Complete')).toBeInTheDocument();
    });
  });

  it('should call markPaid when Settle button is clicked', async () => {
    const mockSignTx = vi.fn();
    (useWallet as any).mockReturnValue({
      address: 'GPAYER',
      signTx: mockSignTx,
    });

    (soroban.markPaid as any).mockResolvedValue('mock-tx');
    (soroban.submitSignedTransaction as any).mockResolvedValue({ txHash: 'hash123' });

    render(<PayInvoicePage params={{ id: '1' }} />);

    await waitFor(() => {
      expect(screen.getByText('Settle Invoice Now')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Settle Invoice Now'));

    await waitFor(() => {
      expect(soroban.markPaid).toHaveBeenCalledWith('GPAYER', 1n);
      expect(soroban.submitSignedTransaction).toHaveBeenCalled();
      expect(mockToast.updateToast).toHaveBeenCalledWith('toast-id', expect.objectContaining({ type: 'success' }));
    });
  });
});
