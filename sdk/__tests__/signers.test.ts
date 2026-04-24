import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@stellar/freighter-api", () => ({
  getAddress: vi.fn(),
  getNetworkDetails: vi.fn(),
  isConnected: vi.fn(),
  requestAccess: vi.fn(),
  signTransaction: vi.fn(),
}));

import * as freighterApi from "@stellar/freighter-api";

import { createFreighterSigner } from "../src/signers";

describe("createFreighterSigner", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
    vi.mocked(freighterApi.isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(freighterApi.getNetworkDetails).mockResolvedValue({
      network: "TESTNET",
      networkPassphrase: "Test SDF Network ; September 2015",
      networkUrl: "https://rpc.example.test",
    });
  });

  it("uses Freighter to resolve the account and sign transactions", async () => {
    vi.mocked(freighterApi.getAddress).mockResolvedValue({ address: "" });
    vi.mocked(freighterApi.requestAccess).mockResolvedValue({
      address: "GABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF12",
    });
    vi.mocked(freighterApi.signTransaction).mockResolvedValue({
      signerAddress: "GABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF12",
      signedTxXdr: "signed-xdr",
    });

    const signer = createFreighterSigner();
    const address = await signer.getPublicKey();
    const signed = await signer.signTransaction("unsigned-xdr", {
      networkPassphrase: "Test SDF Network ; September 2015",
    });

    expect(address).toBe("GABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF12");
    expect(signed).toBe("signed-xdr");
    expect(freighterApi.signTransaction).toHaveBeenCalledWith("unsigned-xdr", {
      address: "GABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF12",
      networkPassphrase: "Test SDF Network ; September 2015",
    });
  });

  it("throws when Freighter is connected to the wrong network", async () => {
    vi.mocked(freighterApi.getAddress).mockResolvedValue({
      address: "GABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF12",
    });
    vi.mocked(freighterApi.getNetworkDetails).mockResolvedValue({
      network: "PUBLIC",
      networkPassphrase: "Public Global Stellar Network ; September 2015",
      networkUrl: "https://rpc.example.public",
    });

    const signer = createFreighterSigner();

    await expect(
      signer.signTransaction("unsigned-xdr", {
        networkPassphrase: "Test SDF Network ; September 2015",
      }),
    ).rejects.toThrow(
      "Freighter is connected to a different Stellar network.",
    );
  });
});
