import Button from "@/components/ui/button";
import { MarketList } from "@/components/markets/MarketList";
import { Link } from "react-router-dom";

export function Home() {
  return (
    <main className="max-w-[1220px] mx-auto">
      <section className="mx-auto flex flex-col items-start justify-center min-h-[80vh] px-8">
        <h1 className="text-[2.5em] md:text-[4em] font-neueMachinaBold">
          <span className="bg-fuchsia-500 px-4 py-2 inline-block mb-4">
            Bitcoin's first
          </span>
          <br />
          <span className="bg-[#79c600] px-4 py-2 inline-block">
            distribution market
          </span>
        </h1>

        <Button className="mt-8">
          <Link to="/market">Start Trading</Link>
        </Button>
      </section>

      <section className="py-16 px-8">
        <h2 className="text-[2em] md:text-[3em] font-neueMachinaBold mb-8">
          <span className="bg-blue-500 px-4 py-2 text-white">
            Go Beyond Yes/No
          </span>
        </h2>
        <p className="max-w-2xl text-lg mb-8 text-black">
          Traditional prediction markets are limited to binary outcomes. We're bringing full probability distribution trading to Bitcoin through Rootstock.
        </p>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
          <div className="relative">
            <img 
              src="/assets/binary-market.svg" 
              alt="Binary Market Example"
              className="w-full h-auto rounded-lg shadow-lg"
            />
            <div className="absolute top-0 left-0 bg-black/50 text-white px-3 py-1 rounded-tl-lg">
              Traditional
            </div>
          </div>
          <div className="relative">
            <img 
              src="/assets/distribution-market.svg"
              alt="Distribution Market Example" 
              className="w-full h-auto rounded-lg shadow-lg"
            />
            <div className="absolute top-0 left-0 bg-blue-500/50 text-white px-3 py-1 rounded-tl-lg">
              Our Approach
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-8 bg-gray-50">
        <h2 className="text-[2em] md:text-[3em] font-neueMachinaBold mb-8">
          <span className="bg-purple-500 px-4 py-2 text-white">
            Built for Bitcoin
          </span>
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl">
          <div className="bg-white p-6 rounded-lg shadow">
            <img src="/assets/rsk-icon.svg" alt="Rootstock Icon" className="w-12 h-12 mb-4" />
            <h3 className="font-bold text-xl mb-2 text-black">Rootstock Smart Contracts</h3>
            <p className="text-black">Advanced DeFi functionality secured by Bitcoin's network</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <img src="/assets/pyth-icon.svg" alt="Pyth Icon" className="w-12 h-12 mb-4" />
            <h3 className="font-bold text-xl mb-2 text-black">Pyth Integration</h3>
            <p className="text-black">Reliable price feeds for accurate market resolution</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <img src="/assets/rif-icon.svg" alt="RIF Icon" className="w-12 h-12 mb-4" />
            <h3 className="font-bold text-xl mb-2 text-black">RIF Support</h3>
            <p className="text-black">Trade using RBTC or RIF as collateral</p>
          </div>
        </div>
      </section>

      <section className="py-16 px-8">
        <h2 className="text-[2em] md:text-[3em] font-neueMachinaBold mb-8">
          <span className="bg-green-500 px-4 py-2 text-white">
            Active Markets
          </span>
        </h2>
        <MarketList />
      </section>
    </main>
  );
}
