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
import { usePublicClient, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { marketAbi } from "@/lib/web3Config";
import { parseEther } from "viem";
import { fromSD59x18, toSD59x18 } from "@/lib/utils/sd59x18";
import { abi as ERC20Abi } from "@/assets/abis/ERC20abi";

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

  const { reads, writes, status, userAddress } = useLiquidityState(marketAddress);

  const [addAmount, setAddAmount] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [expectedShares, setExpectedShares] = useState("0");
  const [pythSymbol, setPythSymbol] = useState("");
  const [legs, setLegs] = useState<Array<{ index: number; oldMean: bigint; oldSigma: bigint; newMean: bigint; newSigma: bigint; isOpen: boolean }>>([]);
  const [selectedLegIndex, setSelectedLegIndex] = useState<number | null>(null);
  const [quoteClose, setQuoteClose] = useState<{ collateral?: bigint; argminX?: bigint; expectedRefund?: bigint } | null>(null);
  const [isQuotingClose, setIsQuotingClose] = useState(false);
  const [tradeFeeWei, setTradeFeeWei] = useState<bigint | null>(null);
  const [closeFeeWei, setCloseFeeWei] = useState<bigint | null>(null);
  const { data: closeHash, writeContract: writeClose, isPending: isClosePending } = useWriteContract();
  const { isLoading: isCloseConfirming, isSuccess: isCloseConfirmed } = useWaitForTransactionReceipt({ hash: closeHash });

  const publicClient = usePublicClient();
  const contractForReads = useMemo(() => ({
    address: marketAddress,
    abi: marketAbi,
  } as const), [marketAddress]);

  // --- Additional reads for lifecycle and metadata ---
  const { data: tokenNameData } = useReadContract({
    ...contractForReads,
    functionName: "name",
  });
  const { data: tokenSymbolData } = useReadContract({
    ...contractForReads,
    functionName: "symbol",
  });
  const { data: expiryData } = useReadContract({
    ...contractForReads,
    functionName: "expiry",
  });
  const { data: priceFeedIdData } = useReadContract({
    ...contractForReads,
    functionName: "priceFeedId",
  });

  // Collateral token symbol for display
  const { data: collateralSymbolData } = useReadContract({
    address: reads.collateralToken,
    abi: ERC20Abi,
    functionName: "symbol",
    query: { enabled: !reads.isNative },
  });
  const collateralSymbol = reads.isNative ? 'RBTC' : ((collateralSymbolData as string) || 'TOKEN');

  const tokenName = (tokenNameData as string) || "";
  const tokenSymbol = (tokenSymbolData as string) || "";
  const expiry = expiryData ? Number(expiryData as bigint) : 0;
  const priceFeedId = (priceFeedIdData as `0x${string}`) || ("" as `0x${string}`);

  const lifecycle = useMemo(() => {
    if (!expiry) return { status: "-", label: "Unknown", detail: "-" };
    const now = Math.floor(Date.now() / 1000);
    const isExpired = now >= expiry;
    const delta = Math.abs(expiry - now);
    const days = Math.floor(delta / 86400);
    const hours = Math.floor((delta % 86400) / 3600);
    const mins = Math.floor((delta % 3600) / 60);
    const human = `${days}d ${hours}h ${mins}m`;
    return isExpired
      ? { status: "Expired", label: "Expired", detail: `${human} ago` }
      : { status: "Active", label: "Active", detail: `in ${human}` };
  }, [expiry]);

  const expiryDateText = useMemo(() => {
    if (!expiry) return "-";
    try { return new Date(expiry * 1000).toUTCString(); } catch { return "-"; }
  }, [expiry]);

  const [copiedId, setCopiedId] = useState(false);
  const copyPriceFeedId = async () => {
    if (!priceFeedId) return;
    try {
      await navigator.clipboard.writeText(priceFeedId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 1200);
    } catch {}
  };

  // Resolve Pyth symbol from priceFeedId for TradingView deep link
  useEffect(() => {
    let active = true;
    const fetchSymbol = async () => {
      try {
        if (!priceFeedId) return;
        const url = `https://hermes.pyth.network/v2/price_feeds?ids[]=${priceFeedId}`;
        const res = await fetch(url, { headers: { accept: 'application/json' } });
        if (!res.ok) return;
        const json = await res.json();
        if (!active) return;
        const first = Array.isArray(json) && json.length ? json[0] : null;
        const raw = first?.attributes?.symbol || first?.symbol || "";
        if (raw) setPythSymbol(String(raw));
      } catch {
        // ignore
      }
    };
    fetchSymbol();
    return () => { active = false; };
  }, [priceFeedId]);

  const tradingViewDisplay = useMemo(() => {
    if (!pythSymbol) return "";
    const withoutPrefix = pythSymbol.includes('.') ? pythSymbol.split('.').slice(1).join('.') : pythSymbol;
    const clean = withoutPrefix.replace(/\//g, '').replace(/[^A-Za-z0-9]/g, '');
    return clean ? `PYTH:${clean}` : "";
  }, [pythSymbol]);

  const tradingViewUrl = useMemo(() => {
    if (!tradingViewDisplay) return "";
    const [, sym] = tradingViewDisplay.split(':');
    if (!sym) return "";
    return `https://www.tradingview.com/symbols/PYTH-${sym}/`;
  }, [tradingViewDisplay]);

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

  // Estimate network fee for proposed trade (gas * gasPrice in RBTC)
  useEffect(() => {
    (async () => {
      try {
        if (!publicClient || !quote.collateral || !quote.argminX) { setTradeFeeWei(null); return; }
        const gas = await publicClient.estimateContractGas({
          ...contractForReads,
          functionName: "trade",
          args: [toSD59x18(proposedState.mu), toSD59x18(proposedState.sigma), quote.argminX],
          value: reads.isNative ? quote.collateral : 0n,
        });
        const gasPrice = await publicClient.getGasPrice();
        setTradeFeeWei(gas * gasPrice);
      } catch {
        setTradeFeeWei(null);
      }
    })();
  }, [publicClient, contractForReads, proposedState.mu, proposedState.sigma, quote.collateral, quote.argminX, reads.isNative]);

  // Estimate network fee for closing selected leg
  useEffect(() => {
    (async () => {
      try {
        if (!publicClient || !quoteClose?.argminX || selectedLegIndex === null) { setCloseFeeWei(null); return; }
        const leg = legs.find(l => l.index === selectedLegIndex);
        if (!leg) { setCloseFeeWei(null); return; }
        const gas = await publicClient.estimateContractGas({
          ...contractForReads,
          functionName: "trade",
          args: [leg.oldMean, leg.oldSigma, quoteClose.argminX],
          value: reads.isNative ? (quoteClose.collateral ?? 0n) : 0n,
        });
        const gasPrice = await publicClient.getGasPrice();
        setCloseFeeWei(gas * gasPrice);
      } catch {
        setCloseFeeWei(null);
      }
    })();
  }, [publicClient, contractForReads, selectedLegIndex, legs, quoteClose?.argminX, quoteClose?.collateral, reads.isNative]);

  // Fetch user position legs
  useEffect(() => {
    (async () => {
      try {
        if (!publicClient || !userAddress) return;
        const count = await publicClient.readContract({ ...contractForReads, functionName: "getPositionLegCount", args: [userAddress] });
        const n = Number(count as bigint);
        const out: Array<{ index: number; oldMean: bigint; oldSigma: bigint; newMean: bigint; newSigma: bigint; isOpen: boolean }> = [];
        for (let i = 0; i < n; i++) {
          const res = await publicClient.readContract({ ...contractForReads, functionName: "getPositionLeg", args: [userAddress, BigInt(i)] });
          const [oldMean, oldSigma, newMean, newSigma, isOpen] = res as [bigint, bigint, bigint, bigint, boolean];
          out.push({ index: i, oldMean, oldSigma, newMean, newSigma, isOpen });
        }
        setLegs(out);
      } catch (e) {
        setLegs([]);
      }
    })();
  }, [publicClient, userAddress, contractForReads, isConfirmed]);

  const handleQuoteClose = async () => {
    if (selectedLegIndex === null) return;
    setIsQuotingClose(true);
    try {
      const res = await publicClient!.readContract({ ...contractForReads, functionName: "quoteClosePosition", args: [BigInt(selectedLegIndex)] });
      const [collateral, argminX, expectedRefund] = res as [bigint, bigint, bigint];
      setQuoteClose({ collateral, argminX, expectedRefund });
    } catch (e) {
      setQuoteClose(null);
    } finally {
      setIsQuotingClose(false);
    }
  };

  // removed unused handleClosePosition

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
              <TabsTrigger value="positions">Positions</TabsTrigger>
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
                  <span className="text-xl font-semibold text-black">
                    {quote.collateral ? `${parseFloat(formatEther(quote.collateral)).toFixed(6)}` : "0.000000"} {collateralSymbol}
                  </span>
                </div>
                <div className="text-xs text-black space-y-1">
                  <div className="flex justify-between"><span>NETWORK FEE (EST)</span><span>{tradeFeeWei ? `${parseFloat(formatEther(tradeFeeWei)).toFixed(6)} RBTC` : '-'}</span></div>
                  <div className="flex justify-between">
                    <span>MIN Δf(x)</span>
                    <span>
                      {quote.collateral ? `-${parseFloat(formatEther(quote.collateral)).toFixed(6)} ${collateralSymbol}` : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ARG MINX</span>
                    <span>
                      {quote.argminX ? fromSD59x18(quote.argminX as bigint).toFixed(6) : "-"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-black mt-2">Collateral secures against maximum potential loss.</p>
              </div>
              
              <div className="mt-6">
                {!reads.isNative && (
                  <div className="flex gap-2">
                    <Button className="text-white" type="button" disabled={!quote.collateral || status.isWriting || status.isConfirming} onClick={() => writes.approve(quote.collateral ? formatEther(quote.collateral) : '0')}>
                      Approve {collateralSymbol}
                    </Button>
                  </div>
                )}
                <Button 
                  onClick={executeTrade} 
                  disabled={!quote.collateral || isExecuting || (!reads.isNative && (!!quote.collateral && reads.allowance < quote.collateral))}
                  className="mt-2 text-white w-full"
                >
                  {isExecuting ? 'Proposing...' : 'Propose new distribution'}
                </Button>
                {!reads.isNative && (
                  <p className="text-xs text-black mt-1">Approved: {parseFloat(formatEther(reads.allowance)).toFixed(6)} {collateralSymbol}</p>
                )}
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

          <TabsContent value="positions">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-2 text-black">Your Positions</h2>
              {!userAddress && <p className="text-sm text-black">Connect wallet to view positions.</p>}
              {userAddress && (
                <>
                  {legs.length === 0 ? (
                    <p className="text-sm text-black">No positions yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {legs.map((leg) => (
                        <label key={leg.index} className={`flex items-center justify-between p-2 border border-black ${selectedLegIndex===leg.index? 'bg-black/5':''}`}>
                          <div className="text-xs text-black space-y-1">
                            <div className="flex gap-3">
                              <span className="font-semibold">Leg #{leg.index}</span>
                              <span className={leg.isOpen? 'text-green-700':'text-gray-500'}>{leg.isOpen? 'Open':'Closed'}</span>
                            </div>
                            <div>Old μ: {fromSD59x18(leg.oldMean).toFixed(4)} | Old σ: {fromSD59x18(leg.oldSigma).toFixed(4)}</div>
                            <div>New μ: {fromSD59x18(leg.newMean).toFixed(4)} | New σ: {fromSD59x18(leg.newSigma).toFixed(4)}</div>
                          </div>
                          <input
                            type="radio"
                            name="selectedLeg"
                            checked={selectedLegIndex===leg.index}
                            onChange={() => {
                              setSelectedLegIndex(leg.index);
                              setProposedState({ mu: fromSD59x18(leg.newMean), sigma: fromSD59x18(leg.newSigma) });
                            }}
                          />
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 flex gap-2">
                    <Button className="text-white" type="button" disabled={selectedLegIndex===null || isQuotingClose} onClick={handleQuoteClose}>
                      {isQuotingClose? 'Quoting…':'Quote Close'}
                    </Button>
                  </div>

                  {quoteClose && (
                    <div className="mt-3 p-3 border border-black bg-white">
                      <div className="text-sm text-black space-y-1">
                        <div className="flex justify-between"><span>Collateral to Close</span><span>{parseFloat(formatEther(quoteClose.collateral!)).toFixed(6)} {collateralSymbol}</span></div>
                        <div className="flex justify-between"><span>Expected Refund</span><span>{fromSD59x18(quoteClose.expectedRefund!).toFixed(6)} {collateralSymbol}</span></div>
                        <div className="flex justify-between"><span>Arg MinX</span><span>{fromSD59x18(quoteClose.argminX!).toFixed(6)}</span></div>
                        <div className="flex justify-between"><span>Network Fee (est)</span><span>{closeFeeWei ? `${parseFloat(formatEther(closeFeeWei)).toFixed(6)} RBTC` : '-'}</span></div>
                      </div>
                      <div className="mt-3">
                        {!reads.isNative && (
                          <div className="flex gap-2 mb-2">
                            <Button className="text-white" type="button" disabled={isClosePending || isCloseConfirming} onClick={() => writes.approve(quoteClose?.collateral ? formatEther(quoteClose.collateral) : '0')}>
                              Approve {collateralSymbol}
                            </Button>
                          </div>
                        )}
                        <Button className="w-full text-white" type="button" disabled={isClosePending || isCloseConfirming || (!reads.isNative && (!!quoteClose?.collateral && reads.allowance < quoteClose.collateral))} onClick={() => {
                          // Use correct msg.value for native vs ERC20
                          if (selectedLegIndex === null || !quoteClose?.collateral || !quoteClose?.argminX) return;
                          const leg = legs.find(l => l.index === selectedLegIndex);
                          if (!leg) return;
                          writeClose({
                            ...contractForReads,
                            functionName: "trade",
                            args: [leg.oldMean, leg.oldSigma, quoteClose.argminX!],
                            value: reads.isNative ? quoteClose.collateral! : 0n,
                          });
                        }}>
                          {isCloseConfirming ? 'Closing…' : 'Close Position'}
                        </Button>
                        {isCloseConfirming && <p className="text-center mt-2 text-sm text-black">Waiting for confirmation...</p>}
                        {isCloseConfirmed && closeHash && (
                          <div className="mt-2 text-center">
                            <a href={`https://explorer.testnet.rootstock.io/tx/${closeHash}`} target="_blank" rel="noreferrer" className="text-blue-600 text-xs underline">View close tx</a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

            <TabsContent value="liquidity">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-2 text-black">Add Liquidity</h2>
                <label className="text-sm text-black">Amount of {reads.isNative ? 'RBTC' : collateralSymbol} to provide</label>
                <Input
                  placeholder="0.0"
                  value={addAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddAmount(e.target.value)}
                  type="number"
                  min="0"
                  step="0.000000000000000001"
                />
                {!reads.isNative && (
                  <div className="flex gap-2">
                    <Button className="text-white" disabled={!addAmount || status.isWriting || status.isConfirming} onClick={() => writes.approve(addAmount)}>
                      Approve
                    </Button>
                    <Button className="text-white" disabled={!addAmount || status.isWriting || status.isConfirming} onClick={() => writes.addLiquidity(addAmount)}>
                      {status.isConfirming ? 'Adding...' : 'Add Liquidity'}
                    </Button>
                  </div>
                )}
                {reads.isNative && (
                  <Button className="w-full text-white" disabled={!addAmount || status.isWriting || status.isConfirming} onClick={() => writes.addLiquidity(addAmount)}>
                    {status.isConfirming ? 'Adding...' : 'Add Liquidity'}
                  </Button>
                )}

                <div className="mt-2 text-sm text-black">
                  <div className="flex justify-between"><span>You will receive (approx):</span><span>{Number(expectedShares).toFixed(6)} {tokenSymbol ? `${tokenSymbol}` : 'LP Tokens'}</span></div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-black mb-2">Your Liquidity Position</h3>
                  <div className="text-sm text-black space-y-1">
                    <div className="flex justify-between"><span>Your {tokenSymbol ? `${tokenSymbol}` : 'LP Tokens'}</span><span>{parseFloat(formatEther(reads.userShares)).toFixed(6)}</span></div>
                    <div className="flex justify-between"><span>Total {tokenSymbol ? `${tokenSymbol} Supply` : 'LP Supply'}</span><span>{parseFloat(formatEther(reads.totalShares)).toFixed(6)}</span></div>
                    <div className="flex justify-between"><span>Total Collateral in Pool</span><span>{parseFloat(formatEther(reads.totalCollateral)).toFixed(6)} {collateralSymbol}</span></div>
                    <div className="flex justify-between"><span>Your Pool Share %</span><span>{reads.poolSharePercent.toFixed(6)}%</span></div>
                    <div className="flex justify-between"><span>Value of Your Shares</span><span>{parseFloat(reads.userShareValueRbtc).toFixed(6)} {collateralSymbol}</span></div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-black mb-2">Remove Liquidity</h3>
                  <label className="text-sm text-black">{tokenSymbol ? `${tokenSymbol} to burn` : 'LP Tokens to burn'}</label>
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
          {/* LP Token Metadata */}
          <div className="bg-white p-4 border border-black relative after:content-[''] after:absolute after:h-full after:w-full after:border after:border-black after:bg-black after:top-[6px] after:left-2 after:z-[-1]">
              <h3 className="font-semibold mb-2 text-black">LP TOKEN</h3>
              <div className="text-sm text-black space-y-1">
                <div className="flex justify-between"><span>Name</span><span className="ml-3 truncate max-w-[55%]" title={tokenName}>{tokenName || '-'}</span></div>
                <div className="flex justify-between"><span>Symbol</span><span>{tokenSymbol || '-'}</span></div>
                <div className="flex justify-between"><span>Token Address</span><span className="ml-3 truncate max-w-[55%]" title={marketAddress}>{marketAddress}</span></div>
              </div>
          </div>
          {/* Oracle / Price Feed */}
          <div className="bg-white p-4 border border-black relative after:content-[''] after:absolute after:h-full after:w-full after:border after:border-black after:bg-black after:top-[6px] after:left-2 after:z-[-1]">
              <h3 className="font-semibold mb-2 text-black">ORACLE</h3>
              <div className="text-sm text-black space-y-2">
                <div className="flex flex-col">
                  <span className="mb-1">Pyth Price Feed ID</span>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs break-all">{priceFeedId || '-'}</code>
                    {priceFeedId && (
                      <button onClick={copyPriceFeedId} className="px-2 py-1 border border-black bg-white hover:bg-black/5 text-xs">
                        {copiedId ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>
                {priceFeedId && (
                  <a
                    className="text-xs text-blue-600 underline"
                    href={`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${priceFeedId}`}
                    target="_blank" rel="noreferrer"
                  >View latest price update</a>
                )}
                {tradingViewUrl && (
                  <a
                    className="block text-xs text-blue-600 underline"
                    href={tradingViewUrl}
                    target="_blank" rel="noreferrer"
                  >Open in TradingView ({tradingViewDisplay})</a>
                )}
              </div>
          </div>
          {/* Lifecycle */}
          <div className="bg-white p-4 border border-black relative after:content-[''] after:absolute after:h-full after:w-full after:border after:border-black after:bg-black after:top-[6px] after:left-2 after:z-[-1]">
              <h3 className="font-semibold mb-2 text-black">LIFECYCLE</h3>
              <div className="text-sm text-black space-y-1">
                <div className="flex justify-between"><span>Status</span><span>{lifecycle.label}</span></div>
                <div className="flex justify-between"><span>Expiry (UTC)</span><span className="ml-3 truncate max-w-[55%]" title={expiryDateText}>{expiryDateText}</span></div>
                <div className="flex justify-between"><span>{lifecycle.status === 'Expired' ? 'Expired' : 'Expires'}</span><span>{lifecycle.detail}</span></div>
              </div>
          </div>
        </div>
    </section>
  );
}
