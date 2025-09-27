import { useEffect, useState } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { marketAbi } from "@/lib/web3Config";
import { fromSD59x18, toSD59x18 } from "@/lib/utils/sd59x18";

interface MarketState {
  mean: number;
  sigma: number;
  description: string;
}

interface ProposedState {
  mu: number;
  sigma: number;
}

interface QuoteState {
  collateral: bigint | null;
  argminX: bigint | null;
}

export function useMarketState(marketAddress: `0x${string}`) {
  // State for the on-chain market consensus
  const [marketState, setMarketState] = useState<MarketState | null>(null);
  
  // State for the user's proposed market state from sliders
  const [proposedState, setProposedState] = useState<ProposedState>({ mu: 0, sigma: 1 });

  // State for the quoted collateral and argminX
  const [quote, setQuote] = useState<QuoteState>({ collateral: null, argminX: null });

  const contractReadConfig = {
    address: marketAddress,
    abi: marketAbi,
  } as const;

  // Read: Get initial market consensus
  const { data: meanResult, isLoading: isLoadingMean } = useReadContract({
    ...contractReadConfig,
    functionName: "mean",
  });

  const { data: stdDevResult, isLoading: isLoadingStdDev } = useReadContract({
    ...contractReadConfig,
    functionName: "standardDeviation",
  });

  const { data: descriptionResult, isLoading: isLoadingDescription } = useReadContract({
    ...contractReadConfig,
    functionName: "description",
  });

  useEffect(() => {
    if (meanResult !== undefined && stdDevResult !== undefined && descriptionResult !== undefined) {
      const mean = fromSD59x18(meanResult as bigint);
      const sigma = fromSD59x18(stdDevResult as bigint);
      setMarketState({ mean, sigma, description: descriptionResult as string });
      // Initialize proposed state with market state
      setProposedState({ mu: mean, sigma });
    }
  }, [meanResult, stdDevResult, descriptionResult]);

  // Quote: Get collateral quote for a proposed state
  const { data: quoteResult, refetch: refetchQuote } = useReadContract({
    ...contractReadConfig,
    functionName: 'quoteCollateral',
    args: [toSD59x18(proposedState.mu), toSD59x18(proposedState.sigma)],
    query: {
      enabled: false, // Initially disable this query, we'll trigger it manually
    }
  });

  useEffect(() => {
    const handler = setTimeout(() => {
        if (marketState && (proposedState.mu !== marketState.mean || proposedState.sigma !== marketState.sigma)) {
            refetchQuote();
        }
    }, 200); // 200ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [proposedState, marketState, refetchQuote]);

  useEffect(() => {
    if (quoteResult) {
      const [collateral, argminX] = quoteResult as [bigint, bigint];
      setQuote({ collateral, argminX });
    }
  }, [quoteResult]);
  
  // Write: Execute a trade
  const { data: hash, writeContract } = useWriteContract();

  const executeTrade = () => {
    if (!quote.collateral || !quote.argminX) {
      console.error("No quote available to execute trade");
      return;
    }

    writeContract({
      ...contractReadConfig,
      functionName: 'trade',
      args: [
        toSD59x18(proposedState.mu),
        toSD59x18(proposedState.sigma),
        quote.argminX,
      ],
      value: quote.collateral,
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    });

  return {
    marketState,
    proposedState,
    setProposedState,
    quote,
    executeTrade,
    isLoading: isLoadingMean || isLoadingStdDev || isLoadingDescription,
    isExecuting: isConfirming,
    isConfirmed,
    hash
  };
}
