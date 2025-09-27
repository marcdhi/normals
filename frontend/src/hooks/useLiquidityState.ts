import { useEffect, useMemo } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { marketAbi } from "@/lib/web3Config";
import { formatEther, parseEther } from "viem";

// Types are inferred by return shape; explicit interface retained if needed later

export function useLiquidityState(marketAddress: `0x${string}`) {
  const { address: userAddress } = useAccount();

  const contractBase = useMemo(() => ({ address: marketAddress, abi: marketAbi } as const), [marketAddress]);

  const { data: userSharesData, refetch: refetchUserShares } = useReadContract({
    ...contractBase,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  const { data: totalSharesData, refetch: refetchTotalShares } = useReadContract({
    ...contractBase,
    functionName: "totalSupply",
  });

  const { data: totalCollateralData, refetch: refetchTotalCollateral } = useReadContract({
    ...contractBase,
    functionName: "totalCollateral",
  });

  const userShares = (userSharesData as bigint) ?? 0n;
  const totalShares = (totalSharesData as bigint) ?? 0n;
  const totalCollateral = (totalCollateralData as bigint) ?? 0n;

  const poolSharePercent = useMemo(() => {
    if (!totalShares || totalShares === 0n) return 0;
    // Convert to number cautiously for display; for large values consider BigInt math
    const percent = Number(userShares) / Number(totalShares) * 100;
    return isFinite(percent) ? percent : 0;
  }, [userShares, totalShares]);

  const userShareValueWei = useMemo(() => {
    if (!totalShares || totalShares === 0n) return 0n;
    return (userShares * totalCollateral) / totalShares;
  }, [userShares, totalShares, totalCollateral]);

  const { data: writeHash, writeContract, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: writeHash });

  const addLiquidity = (amountRbtc: string) => {
    if (!amountRbtc || Number(amountRbtc) <= 0) return;
    const value = parseEther(amountRbtc);
    writeContract({
      ...contractBase,
      functionName: "addLiquidity",
      args: [],
      value,
    });
  };

  const removeLiquidity = (sharesToBurn: string) => {
    if (!sharesToBurn || Number(sharesToBurn) <= 0) return;
    const amount = BigInt(sharesToBurn);
    writeContract({
      ...contractBase,
      functionName: "removeLiquidity",
      args: [amount],
    });
  };

  // Refresh reads after confirmations
  useEffect(() => {
    if (isConfirmed) {
      refetchUserShares();
      refetchTotalShares();
      refetchTotalCollateral();
    }
  }, [isConfirmed, refetchUserShares, refetchTotalShares, refetchTotalCollateral]);

  return {
    userAddress,
    reads: {
      userShares,
      totalShares,
      totalCollateral,
      poolSharePercent,
      userShareValueWei,
      userShareValueRbtc: formatEther(userShareValueWei),
    },
    writes: {
      addLiquidity,
      removeLiquidity,
    },
    status: {
      isWriting,
      isConfirming,
      isConfirmed,
      writeHash,
    },
  };
}


