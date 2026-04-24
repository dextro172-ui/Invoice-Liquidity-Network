import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { AnalyticsSDK } from '../src/analytics';

vi.mock('axios');
const mockedAxios = axios as vi.Mocked<typeof axios>;

describe('AnalyticsSDK', () => {
  let sdk: AnalyticsSDK;

  beforeEach(() => {
    sdk = new AnalyticsSDK('https://api.test', 1000); // 1s TTL for testing
    vi.clearAllMocks();
  });

  it('should fetch protocol stats and cache them', async () => {
    const mockStats = { totalInvoices: 10, totalVolume: 1000n, totalYield: 50n, defaultRate: 0.1 };
    mockedAxios.get.mockResolvedValue({ data: mockStats });

    const stats1 = await sdk.getProtocolStats();
    expect(stats1).toEqual(mockStats);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    const stats2 = await sdk.getProtocolStats();
    expect(stats2).toEqual(mockStats);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Should be from cache
  });

  it('should fetch from server again after TTL expires', async () => {
    const mockStats = { totalInvoices: 10, totalVolume: 1000n, totalYield: 50n, defaultRate: 0.1 };
    mockedAxios.get.mockResolvedValue({ data: mockStats });

    await sdk.getProtocolStats();
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    // Wait for TTL (1s)
    await new Promise(resolve => setTimeout(resolve, 1100));

    await sdk.getProtocolStats();
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('should fetch history for different roles', async () => {
    const mockHistory = [{ id: '1', status: 'Paid' }];
    mockedAxios.get.mockResolvedValue({ data: mockHistory });

    await sdk.getInvoiceHistory('addr1', 'freelancer');
    expect(mockedAxios.get).toHaveBeenCalledWith('https://api.test/history/addr1?role=freelancer');

    await sdk.getInvoiceHistory('addr1', 'payer');
    expect(mockedAxios.get).toHaveBeenCalledWith('https://api.test/history/addr1?role=payer');
  });
});
