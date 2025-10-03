import { useEffect, useMemo, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { factoryAddress, factoryAbi } from "@/lib/web3Config";
import { createPublicClient, http, isAddress, type Address } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { Input } from "@/components/ui/input";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import TradingViewWidget from "@/components/TradingViewWidget";

export function Admin() {
    const [initialMean, setInitialMean] = useState('');
    const [initialSigma, setInitialSigma] = useState('');
    const [k, setK] = useState('');
    const [b, setB] = useState('');
    const [description, setDescription] = useState('');
    const [lpTokenName, setLpTokenName] = useState('');
    const [lpTokenSymbol, setLpTokenSymbol] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [whitelistInput, setWhitelistInput] = useState('');

    // Pyth search state
    const [pythQuery, setPythQuery] = useState('');
    const [assetType, setAssetType] = useState('crypto');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [priceFeeds, setPriceFeeds] = useState<Array<{ id: string; attributes?: Record<string, any> }>>([]);
    const [selectedFeed, setSelectedFeed] = useState<{ id: string; symbol?: string } | null>(null);

    // Expiry
    const [expiryLocal, setExpiryLocal] = useState(''); // datetime-local string

    // Collateral token (address(0) for SOL, or token address e.g., SOL)
    const [collateralToken, setCollateralToken] = useState<string>('native');

    const { toast } = useToast();

    const { data, writeContract } = useWriteContract();

    const { isLoading, isSuccess } = useWaitForTransactionReceipt({
        hash: data,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!selectedFeed) throw new Error('Please select a Pyth price feed.');
            if (!expiryLocal) throw new Error('Please set an expiry.');

            // Convert feed id to 0x-prefixed bytes32
            let priceFeedId = selectedFeed.id;
            if (!priceFeedId.startsWith('0x')) priceFeedId = `0x${priceFeedId}`;

            // Convert expiry to unix seconds (uint64)
            const expirySeconds = Math.floor(new Date(expiryLocal).getTime() / 1000);
            if (!Number.isFinite(expirySeconds) || expirySeconds <= 0) throw new Error('Invalid expiry date/time');

            const collateralArg = collateralToken === 'native' ? '0x0000000000000000000000000000000000000000' : collateralToken;

            // Build initial whitelist: resolve ENS if needed
            let initialWhitelist: Address[] = [];
            if (isPrivate && whitelistInput.trim().length > 0) {
                const ensClient = createPublicClient({ chain: mainnet, transport: http() });
                const names = whitelistInput.split(',').map(s => s.trim()).filter(Boolean);
                for (const name of names) {
                    try {
                        if (isAddress(name)) {
                            initialWhitelist.push(name as Address);
                            continue;
                        }
                        const addr = await ensClient.getEnsAddress({ name: normalize(name) });
                        if (addr) initialWhitelist.push(addr as Address);
                    } catch {
                        // ignore unresolvable entries
                    }
                }
            }

            writeContract({
                address: factoryAddress,
                abi: factoryAbi,
                functionName: 'createMarket',
                args: [
                    parseEther(initialMean),
                    parseEther(initialSigma),
                    parseEther(k),
                    parseEther(b),
                    priceFeedId,
                    BigInt(expirySeconds),
                    collateralArg,
                    description,
                    lpTokenName,
                    lpTokenSymbol,
                    isPrivate,
                    initialWhitelist
                ],
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message ?? "Please make sure you enter valid inputs.",
                variant: "destructive",
            });
        }
    };

    useEffect(() => {
        if (isSuccess && data) {
            toast({
                title: "Market Created!",
                description: `Transaction hash: ${data}`,
            });
        }
    }, [isSuccess, data, toast]);

    const selectedTradingViewSymbol = useMemo(() => {
        if (!selectedFeed) return '';
        // Try to derive symbol string; prefer attributes.symbol if present
        const raw = (selectedFeed as any).symbol || (selectedFeed as any).attributes?.symbol || description;
        if (!raw) return '';
        // Remove the prefix (e.g., "Crypto.", "Equity.", etc.) and keep only the part after the dot
        const withoutPrefix = String(raw).includes('.') ? String(raw).split('.').slice(1).join('.') : String(raw);
        // Remove slashes to make it compatible (e.g., Solana/USD -> SolanaUSD)
        const cleanSymbol = withoutPrefix.replace(/\//g, '');
        return cleanSymbol ? `PYTH:${cleanSymbol}` : '';
    }, [selectedFeed, description]);

    const searchPyth = async () => {
        setIsSearching(true);
        setSearchError(null);
        try {
            const url = new URL('https://hermes.pyth.network/v2/price_feeds');
            if (pythQuery) url.searchParams.set('query', pythQuery);
            if (assetType) url.searchParams.set('asset_type', assetType);
            const res = await fetch(url.toString(), { headers: { accept: 'application/json' } });
            if (!res.ok) throw new Error(`Search failed (${res.status})`);
            const json = await res.json();
            setPriceFeeds(Array.isArray(json) ? json : []);
        } catch (err: any) {
            setSearchError(err?.message || 'Failed to search Pyth');
            setPriceFeeds([]);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <section className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-1 text-black">Admin Panel</h1>
                <p className="text-black">Create new distribution markets for the community.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="max-w-2xl">
                    <div className="bg-white p-6 border border-black relative after:content-[''] after:absolute after:h-full after:w-full after:border after:border-black after:bg-black after:top-[6px] after:left-2 after:z-[-1]">
                        <h2 className="text-xl font-semibold mb-6 text-black">Create New Market</h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-black mb-2">Search Pyth Price Feed</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                                    <Input 
                                        placeholder="e.g., SOL or Solana" 
                                        value={pythQuery} 
                                        onChange={(e) => setPythQuery(e.target.value)}
                                    />
                                    <select 
                                        className="border border-black p-2 text-black bg-white"
                                        value={assetType}
                                        onChange={(e) => setAssetType(e.target.value)}
                                    >
                                        <option value="">All</option>
                                        <option value="crypto">Crypto</option>
                                        <option value="equity">Equity</option>
                                        <option value="fx">FX</option>
                                        <option value="metal">Metal</option>
                                        <option value="rates">Rates</option>
                                    </select>
                                    <Button type="button" onClick={searchPyth} disabled={isSearching}>
                                        {isSearching ? 'Searching…' : 'Search'}
                                    </Button>
                                </div>
                                {searchError && <p className="text-red-600 text-sm mt-2">{searchError}</p>}
                                {!!priceFeeds.length && (
                                    <div className="mt-3 max-h-48 overflow-y-auto border border-black">
                                        {priceFeeds.map((pf) => {
                                            const sym = (pf as any).attributes?.symbol || (pf as any).symbol || pf.id;
                                            return (
                                                <button
                                                    type="button"
                                                    key={pf.id}
                                                    onClick={() => setSelectedFeed({ id: pf.id, symbol: sym })}
                                                    className={`w-full text-left p-2 hover:bg-black/5 ${selectedFeed?.id === pf.id ? 'bg-black/10' : ''}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-black text-sm">{sym}</span>
                                                        <code className="text-xs">{pf.id}</code>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {selectedFeed && (
                                    <div className="mt-3">
                                        <p className="text-sm text-black mb-2">Selected: {(selectedFeed.symbol) || selectedFeed.id}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-2">
                                    Market Description
                                </label>
                                <Input 
                                    placeholder="e.g., Solana price by December 2025" 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">
                                        Initial Mean (μ)
                                    </label>
                                    <Input 
                                        placeholder="0.0" 
                                        value={initialMean} 
                                        onChange={(e) => setInitialMean(e.target.value)}
                                        type="number"
                                        step="0.01"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">
                                        Initial Standard Deviation (σ)
                                    </label>
                                    <Input 
                                        placeholder="1.0" 
                                        value={initialSigma} 
                                        onChange={(e) => setInitialSigma(e.target.value)}
                                        type="number"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">
                                        Stiffness Parameter (k)
                                    </label>
                                    <Input 
                                        placeholder="1.0" 
                                        value={k} 
                                        onChange={(e) => setK(e.target.value)}
                                        type="number"
                                        step="0.01"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">
                                        Base Parameter (b)
                                    </label>
                                    <Input 
                                        placeholder="0.1" 
                                        value={b} 
                                        onChange={(e) => setB(e.target.value)}
                                        type="number"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">
                                        LP Token Name
                                    </label>
                                    <Input 
                                        placeholder="e.g., BitCurve SOL-2025 LP" 
                                        value={lpTokenName} 
                                        onChange={(e) => setLpTokenName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">
                                        LP Token Symbol
                                    </label>
                                    <Input 
                                        placeholder="e.g., BC-SOL-LP" 
                                        value={lpTokenSymbol} 
                                        onChange={(e) => setLpTokenSymbol(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-2">Expiry (UTC)</label>
                                <Input 
                                    type="datetime-local"
                                    value={expiryLocal}
                                    onChange={(e) => setExpiryLocal(e.target.value)}
                                />
                                <p className="text-xs text-black mt-1">Market will be considered expired after this timestamp.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-2">Collateral Type</label>
                                <div className="flex gap-4 items-center">
                                    <label className="flex items-center gap-2 text-black text-sm">
                                        <input type="radio" name="collateralType" value="native" checked={collateralToken==='native'} onChange={() => setCollateralToken('native')} />
                                        SOL
                                    </label>
                                    <label className="flex items-center gap-2 text-black text-sm">
                                        <input type="radio" name="collateralType" value="rif" checked={collateralToken!=='native' && collateralToken!=='0x0000000000000000000000000000000000000000'} onChange={() => setCollateralToken('0x19F64674D8A5B4E652319F5e239eFd3bc969A1fE')} />
                                        SOL
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4">
                                <div className="mb-4 flex items-center gap-2">
                                    <input id="privateMarket" type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
                                    <label htmlFor="privateMarket" className="text-sm text-black">Make this a private market</label>
                                </div>
                                {isPrivate && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-black mb-2">Whitelist ENS names or addresses (comma separated)</label>
                                        <textarea
                                            className="w-full border border-black p-2 text-black bg-white"
                                            rows={3}
                                            placeholder="vitalik.eth, user.eth, 0x1234..."
                                            value={whitelistInput}
                                            onChange={(e) => setWhitelistInput(e.target.value)}
                                        />
                                    </div>
                                )}
                                <Button 
                                    type="submit" 
                                    disabled={
                                        isLoading ||
                                        !description ||
                                        !initialMean ||
                                        !initialSigma ||
                                        !k ||
                                        !b ||
                                        !lpTokenName ||
                                        !lpTokenSymbol ||
                                        !selectedFeed ||
                                        !expiryLocal
                                    }
                                    className="w-full text-white bg-black"
                                >
                                    {isLoading ? 'Deploying Market...' : 'Deploy New Market'}
                                </Button>
                                
                                {isLoading && (
                                    <p className="text-center mt-2 text-sm text-black">
                                        Waiting for confirmation...
                                    </p>
                                )}
                                
                                {isSuccess && data && (
                                    <div className="mt-4 text-center">
                                        <p className="text-green-600 font-semibold">Market Created Successfully!</p>
                                        <a 
                                            href={`https://explorer.testnet.rootstock.io/tx/${data}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-500 hover:underline"
                                        >
                                            View on Explorer
                                        </a>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* TradingView Chart Section */}
                {selectedFeed && selectedTradingViewSymbol && (
                    <div className="lg:sticky lg:top-8 h-fit">
                        <div className="bg-white border border-black relative after:content-[''] after:absolute after:h-full after:w-full after:border after:border-black after:bg-black after:top-[6px] after:left-2 after:z-[-1]">
                            <div className="p-4 border-b border-black">
                                <h3 className="text-lg font-semibold text-black">Price Chart</h3>
                                <p className="text-sm text-gray-600">{selectedFeed.symbol || selectedFeed.id}</p>
                            </div>
                            <div className="p-4">
                                <div className="h-[500px] w-full">
                                    <TradingViewWidget 
                                        symbol={selectedTradingViewSymbol} 
                                        theme="light" 
                                        interval="D" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
