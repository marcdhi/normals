import { useEffect, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { factoryAddress, factoryAbi } from "@/lib/web3Config";
import { Input } from "@/components/ui/input";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function Admin() {
    const [initialMean, setInitialMean] = useState('');
    const [initialSigma, setInitialSigma] = useState('');
    const [k, setK] = useState('');
    const [b, setB] = useState('');
    const [description, setDescription] = useState('');
    const [lpTokenName, setLpTokenName] = useState('');
    const [lpTokenSymbol, setLpTokenSymbol] = useState('');

    const { toast } = useToast();

    const { data, writeContract } = useWriteContract();

    const { isLoading, isSuccess } = useWaitForTransactionReceipt({
        hash: data,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            writeContract({
                address: factoryAddress,
                abi: factoryAbi,
                functionName: 'createMarket',
                args: [
                    parseEther(initialMean),
                    parseEther(initialSigma),
                    parseEther(k),
                    parseEther(b),
                    description,
                    lpTokenName,
                    lpTokenSymbol,
                ],
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Please make sure you enter valid numbers.",
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

    return (
        <section className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-1 text-black">Admin Panel</h1>
                <p className="text-black">Create new distribution markets for the community.</p>
            </div>
            
            <div className="max-w-2xl mx-auto">
                <div className="bg-white p-6 border border-black relative after:content-[''] after:absolute after:h-full after:w-full after:border after:border-black after:bg-black after:top-[6px] after:left-2 after:z-[-1]">
                    <h2 className="text-xl font-semibold mb-6 text-black">Create New Market</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-black mb-2">
                                Market Description
                            </label>
                            <Input 
                                placeholder="e.g., Bitcoin price by December 2025" 
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
                                    placeholder="e.g., BitCurve BTC-2025 LP" 
                                    value={lpTokenName} 
                                    onChange={(e) => setLpTokenName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-black mb-2">
                                    LP Token Symbol
                                </label>
                                <Input 
                                    placeholder="e.g., BC-BTC-LP" 
                                    value={lpTokenSymbol} 
                                    onChange={(e) => setLpTokenSymbol(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button 
                                type="submit" 
                                disabled={isLoading || !description || !initialMean || !initialSigma || !k || !b || !lpTokenName || !lpTokenSymbol}
                                className="w-full text-white"
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
        </section>
    );
}
