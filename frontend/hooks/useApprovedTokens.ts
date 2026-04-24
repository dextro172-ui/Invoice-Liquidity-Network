"use client";

import { useEffect, useMemo, useState } from "react";
import { TESTNET_USDC_TOKEN_ID } from "../constants";
import { getApprovedTokenIds, getTokenMetadata, type TokenMetadata } from "../utils/soroban";

export interface ApprovedToken extends TokenMetadata {
  iconLabel: string;
}

function toIconLabel(symbol: string): string {
  return symbol.replace(/[^A-Z0-9]/gi, "").slice(0, 2).toUpperCase() || "TK";
}

export function useApprovedTokens() {
  const [tokens, setTokens] = useState<ApprovedToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTokens() {
      setIsLoading(true);
      setError(null);

      try {
        const tokenIds = await getApprovedTokenIds();
        const metadata = await Promise.all(tokenIds.map((tokenId) => getTokenMetadata(tokenId)));

        if (!cancelled) {
          setTokens(
            metadata.map((token) => ({
              ...token,
              iconLabel: toIconLabel(token.symbol),
            })),
          );
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load approved tokens.");
          setTokens([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadTokens();

    return () => {
      cancelled = true;
    };
  }, []);

  const tokenMap = useMemo(
    () => new Map(tokens.map((token) => [token.contractId, token])),
    [tokens],
  );

  const defaultToken = tokens[0] ?? tokenMap.get(TESTNET_USDC_TOKEN_ID) ?? null;

  return {
    tokens,
    tokenMap,
    defaultToken,
    isLoading,
    error,
  };
}
