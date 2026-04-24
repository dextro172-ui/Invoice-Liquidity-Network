import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ActivityFeed from '../ActivityFeed';

// Mock fetch
const globalFetch = global.fetch;

describe('ActivityFeed', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = globalFetch;
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (global.fetch as any).mockReturnValue(new Promise(() => {})); // Never resolves
    render(<ActivityFeed invoiceId={1n} />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render empty state when no events', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<ActivityFeed invoiceId={1n} />);

    await waitFor(() => {
      expect(screen.getByText('No activity recorded yet.')).toBeInTheDocument();
    });
  });

  it('should render events correctly', async () => {
    const mockEvents = [
      {
        type: 'submitted',
        timestamp: Date.now() - 3600000,
        actor: 'GABC12345678901234567890123456789012345678901234567890123456',
      },
      {
        type: 'funded',
        timestamp: Date.now() - 1800000,
        actor: 'GDEF5678901234567890123456789012345678901234567890123456',
        data: { amount: '5000000000' }
      }
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockEvents,
    });

    render(<ActivityFeed invoiceId={1n} />);

    await waitFor(() => {
      expect(screen.getByText(/Invoice submitted by GABC12\.\.\.3456/)).toBeInTheDocument();
      expect(screen.getByText(/Invoice funded by GDEF56\.\.\.3456 for 500.00 USDC/)).toBeInTheDocument();
      expect(screen.getByText('1 hours ago')).toBeInTheDocument();
    });
  });

  it('should handle fetch error by showing mock data (in dev/demo mode)', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    render(<ActivityFeed invoiceId={1n} />);

    await waitFor(() => {
      expect(screen.getByText(/Invoice submitted by GABC12\.\.\.3456/)).toBeInTheDocument();
      expect(screen.getByText(/Invoice funded by GDEF56\.\.\.3456 for 100.00 USDC/)).toBeInTheDocument();
    });
  });
});
