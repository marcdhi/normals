import { useBitcoinMarketState } from "@/hooks/useBitcoinMarketState";
import { Slider } from "@/components/ui/slider";
import Button from "@/components/ui/button";
import DistributionChart from "@/components/market/DistributionChart";
import { formatEther } from "viem";
import Loader from "@/components/ui/loader";

export function Market() {
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
  } = useBitcoinMarketState();

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
        <h1 className="text-3xl font-bold mb-1 text-black">What price will gold close at in 2025?</h1>
        <p className="text-black">Predicting the USD gold price.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 p-6 border border-black bg-white relative after:content-[''] after:absolute after:h-full after:w-full after:border after:border-black after:bg-black after:top-[6px] after:left-2 after:z-[-1]">
            <div className="p-4">
                <DistributionChart market={marketState} proposed={proposedState} />
            </div>
        </div>

        <div className="bg-white p-6 border border-black flex flex-col justify-between relative after:content-[''] after:absolute after:h-full after:w-full after:border after:border-black after:bg-black after:top-[6px] after:left-2 after:z-[-1]">
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
                {quote.collateral ? `${formatEther(quote.collateral)}` : "0.00"} RBTC
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
