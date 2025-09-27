import { useContractRead } from 'wagmi';
import { factoryAddress, factoryAbi } from '@/lib/web3Config';
import { MarketCard } from './MarketCard';

export function MarketList() {
    const { data: marketAddresses, isLoading } = useContractRead({
        address: factoryAddress,
        abi: factoryAbi,
        functionName: 'getDeployedMarkets',
    });

    if (isLoading) {
        return <div>Loading markets...</div>;
    }

    return (
        <div className="my-8">
            <h2 className="text-2xl font-bold mb-4">Available Markets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(marketAddresses as `0x${string}`[] | undefined)?.map((address) => (
                    <MarketCard key={address} address={address} />
                ))}
            </div>
        </div>
    );
}
