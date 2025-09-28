import Button from "@/components/ui/button";
import { MarketList } from "@/components/markets/MarketList";
import { Link } from "react-router-dom";

export function Home() {
  return (
    <main className="max-w-[900px] mx-auto">
      <section className="mx-auto flex flex-col items-center justify-center min-h-[80vh]">
        <h1 className="text-[2.5em] md:text-[4em] flex gap-2 text-center font-neueMachinaBold">
          <span className="bg-fuchsia-500 px-4 py-2">
            Bitcoin's
          </span>

          <span className="bg-orange-500 px-4 py-2">
            first
          </span>
        </h1>

        <h1 className="text-[2.5em] md:text-[4em] flex gap-2 text-center font-neueMachinaBold mt-4">
          <span className="bg-[#79c600] px-4 py-2">
            Distribution market
          </span>
        </h1>

        <Button className="mt-8">
          <Link to="/market">Explore markets</Link>
        </Button>
      </section>

      <section className="py-16 flex flex-col items-center text-center">
        <h2 className="text-[2em] md:text-[3em] font-neueMachinaBold mb-8">
          <span className="bg-blue-500 px-4 py-2 text-white">
            Go Beyond Yes/No
          </span>
        </h2>
        <p className="max-w-2xl text-lg mb-8">
          Traditional prediction markets are limited to binary outcomes. We're bringing full probability distribution trading to Bitcoin through Rootstock.
        </p>
      </section>

      <section className="py-16 flex flex-col items-center text-center bg-gray-50">
        <h2 className="text-[2em] md:text-[3em] font-neueMachinaBold mb-8">
          <span className="bg-purple-500 px-4 py-2 text-white">
            Built for Bitcoin
          </span>
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto px-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-xl mb-2">Rootstock Smart Contracts</h3>
            <p>Advanced DeFi functionality secured by Bitcoin's network</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-xl mb-2">Pyth Integration</h3>
            <p>Reliable price feeds for accurate market resolution</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-xl mb-2">RIF Support</h3>
            <p>Trade using RBTC or RIF as collateral</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <h2 className="text-[2em] md:text-[3em] font-neueMachinaBold mb-8 text-center">
          <span className="bg-green-500 px-4 py-2 text-white">
            Active Markets
          </span>
        </h2>
        <MarketList />
      </section>
    </main>
  );
}
