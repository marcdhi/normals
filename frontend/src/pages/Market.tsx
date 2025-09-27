import { useParams } from "react-router-dom";
import { useMarketState } from "@/hooks/useMarketState";
import { Slider } from "@/components/ui/slider";
import Button from "@/components/ui/button";
import DistributionChart from "@/components/market/DistributionChart";
import { formatEther } from "viem";
import Loader from "@/components/ui/loader";
import { DISTRIBUTION_MARKET_ADDRESS } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useLiquidityState } from "@/hooks/useLiquidityState";
import { useEffect, useMemo, useState } from "react";
import { usePublicClient } from "wagmi";
import { marketAbi } from "@/lib/web3Config";
import { parseEther } from "viem";

export function Market() {
  const { address } = useParams();
  const marketAddress = (address || DISTRIBUTION_MARKET_ADDRESS) as `0x${string}`;

  const {
    marketState,
    proposedState,
    setProposedState,
    quote,
    executeTrade,
    isLoading,
    isExecuting,
    isConfirmed,
    hash,
  } = useMarketState(marketAddress);

  const { reads, writes, status } = useLiquidityState(marketAddress);

  const [addAmount, setAddAmount] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [expectedShares, setExpectedShares] = useState("0");

  const publicClient = usePublicClient();
  const contractForReads = useMemo(() => ({
    address: marketAddress,
    abi: marketAbi,
  } as const), [marketAddress]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      try {
        if (!publicClient) return;
        const parsed = parseFloat(addAmount);
        if (!addAmount || isNaN(parsed) || parsed <= 0) {
          setExpectedShares("0");
          return;
        }
        const collateralWei = parseEther(addAmount as `${number}`);
        const shares = await publicClient.readContract({
          ...contractForReads,
          functionName: "quoteAddLiquidity",
          args: [collateralWei],
        });
        setExpectedShares(formatEther(shares as bigint));
      } catch (e) {
        setExpectedShares("0");
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [addAmount, publicClient, contractForReads]);

  const handleMuChange = (value: number[]) => {
    setProposedState(prev => ({ ...prev, mu: value[0] }));
  };

  const handleSigmaChange = (value: number[]) => {
    setProposedState(prev => ({ ...prev, sigma: value[0] }));
  };

  if (isLoading || !marketState) {
    return <div className="text-center p-10"><Loader /> <p className="text-black">Loading Market Data...</p></div>;
  }

  return (
    <section className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1 text-black">{marketState.description}</h1>
        <p className="text-black">Predicting the future, one distribution at a time.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 p-6 border border-black bg-white relative after:content-[''] after:absolute after:h-full after:w-full after:border after:border-black after:bg-black after:top-[6px] after:left-2 after:z-[-1]">
            <div className="p-4">
                <DistributionChart market={marketState} proposed={proposedState} />
            </div>
        </div>

        <div className="bg-white p-6 border border-black flex flex-col justify-between relative after:content-[''] after:absolute after:h-full after:w-full after:border after:border-black after:bg-black after:top-[6px] after:left-2 after:z-[-1]">
          <Tabs defaultValue="trade">
            <TabsList className="bg-white border border-black">
              <TabsTrigger value="trade">Trade</TabsTrigger>
              <TabsTrigger value="liquidity">Add Liquidity</TabsTrigger>
            </TabsList>

            <TabsContent value="trade">
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-4 text-black">Current</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-black">
                      <span>MEAN (M)</span>
                      <span>{proposedState.mu.toFixed(2)}</span>
                    </div>
                    <Slider
                      min={marketState.mean - 2 * marketState.sigma}
                      max={marketState.mean + 2 * marketState.sigma}
                      step={0.01}
                      value={[proposedState.mu]}
                      onValueChange={handleMuChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-black">
                      <span>STD DEV (Σ)</span>
                      <span>{proposedState.sigma.toFixed(2)}</span>
                    </div>
                    <Slider
                      min={Math.max(0.1, marketState.sigma / 2)}
                      max={marketState.sigma * 2}
                      step={0.01}
                      value={[proposedState.sigma]}
                      onValueChange={handleSigmaChange}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-black mt-1">
                      <span>Min σ: {(marketState.sigma / 2).toFixed(3)} (contract enforced)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-black">Collateral Required</span>
                  <span className="text-2xl font-semibold text-black">
                    {quote.collateral ? `${parseFloat(formatEther(quote.collateral)).toFixed(6)}` : "0.000000"} RBTC
                  </span>
                </div>
                <div className="text-xs text-black space-y-1">
                  <div className="flex justify-between"><span>FEES (EST)</span><span>-</span></div>
                  <div className="flex justify-between"><span>MIN F(X)</span><span>-</span></div>
                  <div className="flex justify-between"><span>ARG MINX</span><span>-</span></div>
                </div>
                <p className="text-xs text-black mt-2">Collateral secures against maximum potential loss.</p>
              </div>
              
              <div className="mt-6">
                <Button 
                  onClick={executeTrade} 
                  disabled={!quote.collateral || isExecuting}
                  className="mt-8 text-white w-full"
                >
                  {isExecuting ? 'Proposing...' : 'Propose new distribution'}
                </Button>
                {isExecuting && <p className="text-center mt-2 text-sm text-black">Waiting for confirmation...</p>}
                {isConfirmed && hash && (
                  <div className="mt-4 text-center">
                    <p className="text-green-600 font-semibold">Trade Confirmed!</p>
                    <a 
                      href={`https://explorer.testnet.rootstock.io/tx/${hash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      View on Explorer
                    </a>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="liquidity">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-2 text-black">Add Liquidity</h2>
                <label className="text-sm text-black">Amount of RBTC to provide</label>
                <Input
                  placeholder="0.0"
                  value={addAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddAmount(e.target.value)}
                  type="number"
                  min="0"
                  step="0.000000000000000001"
                />
                <Button className="w-full text-white" disabled={!addAmount || status.isWriting || status.isConfirming} onClick={() => writes.addLiquidity(addAmount)}>
                  {status.isConfirming ? 'Adding...' : 'Add Liquidity'}
                </Button>

                <div className="mt-2 text-sm text-black">
                  <div className="flex justify-between"><span>You will receive (approx):</span><span>{Number(expectedShares).toFixed(6)} LP Shares</span></div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-black mb-2">Your Liquidity Position</h3>
                  <div className="text-sm text-black space-y-1">
                    <div className="flex justify-between"><span>Your LP Shares</span><span>{reads.userShares.toString()}</span></div>
                    <div className="flex justify-between"><span>Total LP Shares</span><span>{reads.totalShares.toString()}</span></div>
                    <div className="flex justify-between"><span>Total Collateral in Pool</span><span>{parseFloat(formatEther(reads.totalCollateral)).toFixed(6)} RBTC</span></div>
                    <div className="flex justify-between"><span>Your Pool Share %</span><span>{reads.poolSharePercent.toFixed(6)}%</span></div>
                    <div className="flex justify-between"><span>Value of Your Shares</span><span>{parseFloat(reads.userShareValueRbtc).toFixed(6)} RBTC</span></div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-black mb-2">Remove Liquidity</h3>
                  <label className="text-sm text-black">Shares to burn</label>
                  <Input
                    placeholder="0"
                    value={burnAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBurnAmount(e.target.value)}
                    type="number"
                    min="0"
                  />
                  <Button className="w-full text-white mt-2" disabled={!burnAmount || status.isWriting || status.isConfirming} onClick={() => writes.removeLiquidity(burnAmount)}>
                    {status.isConfirming ? 'Removing...' : 'Remove Liquidity'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
       <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Placeholder for STIFFNESS, CAP & SCALE, LIFECYCLE */}
            <div className="bg-white p-4 border border-black relative after:content-[''] after:absolute after:h-full after:w-full after:border after:border-black after:bg-black after:top-[6px] after:left-2 after:z-[-1]">
                <h3 className="font-semibold mb-2 text-black">STIFFNESS (LOCAL)</h3>
                <p className="text-sm text-black">Data not available from contract.</p>
            </div>
            <div className="bg-white p-4 border border-black relative after:content-[''] after:absolute after:h-full after:w-full after:border after:border-black after:bg-black after:top-[6px] after:left-2 after:z-[-1]">
                <h3 className="font-semibold mb-2 text-black">CAP & SCALE (Λ)</h3>
                 <p className="text-sm text-black">Data not available from contract.</p>
            </div>
            <div className="bg-white p-4 border border-black relative after:content-[''] after:absolute after:h-full after:w-full after:border after:border-black after:bg-black after:top-[6px] after:left-2 after:z-[-1]">
                <h3 className="font-semibold mb-2 text-black">LIFECYCLE</h3>
                 <p className="text-sm text-black">Data not available from contract.</p>
            </div>
        </div>
    </section>
  );
}
