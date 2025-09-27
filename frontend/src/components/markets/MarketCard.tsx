import { useReadContract } from "wagmi";
import { marketAbi } from "@/lib/web3Config";
import { fromSD59x18 } from "@/lib/utils/sd59x18";
import { Link } from "react-router-dom";
import Button from "@/components/ui/button";

export function MarketCard({ address }: { address: `0x${string}` }) {
    const { data: mean } = useReadContract({
        address,
        abi: marketAbi,
        functionName: 'mean',
    });

    const { data: stdDev } = useReadContract({
        address,
        abi: marketAbi,
        functionName: 'standardDeviation',
    });

    const { data: description } = useReadContract({
        address,
        abi: marketAbi,
        functionName: 'description',
    });

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
            <h3 className="text-xl font-bold text-white mb-4">{description as string}</h3>
            <div className="space-y-2 mb-6">
                <p className="text-gray-300">Mean: {mean ? fromSD59x18(mean as bigint).toFixed(2) : 'Loading...'}</p>
                <p className="text-gray-300">Standard Deviation: {stdDev ? fromSD59x18(stdDev as bigint).toFixed(2) : 'Loading...'}</p>
            </div>
            <Link to={`/market/${address}`} className="w-full">
                <Button className="w-full">Trade</Button>
            </Link>
        </div>
    );
}
