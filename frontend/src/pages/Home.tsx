import Button from "@/components/ui/button";
// import { MarketList } from "@/components/markets/MarketList";
import { Link } from "react-router-dom";

export function Home() {
  return (
    <main className="max-w-[1220px] mx-auto">
      <section className="mx-auto flex flex-col items-start justify-center min-h-[80vh] px-8">
        <h1 className="text-[2.5em] md:text-[4em] font-neueMachinaBold">
          <span className="bg-fuchsia-500 px-4 py-2 inline-block mb-4">
            Solana's first
          </span>
          <br />
          <span className="bg-[#79c600] px-4 py-2 inline-block">
            distribution market
          </span>
        </h1>

        <p className="text-lg mt-8 mb-8 max-w-2xl text-black">
          Current prediction markets are stuck in a binary world of "yes/no"
          outcomes. Normals goes beyond that, letting you trade on the full
          probability distribution of any event - expressing complex views and
          capturing the true range of possible outcomes.
        </p>

        <Button className="mt-4">
          <Link to="/">Start Trading</Link>
        </Button>
      </section>

      <section className="py-32 px-8">
        <h2 className="text-[2em] md:text-[3em] font-neueMachinaBold mb-8">
          <span className="bg-blue-500 px-4 py-2 text-white">How It Works</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-12 max-w-4xl items-center">
          <div>
            <p className="text-lg mb-6 text-black">
              The core of Normals is a constant function AMM with an L₂ norm
              invariant, specialized for Normal distributions. Unlike Uniswap's
              x*y=k, our invariant ensures the "total size" of the market's
              probability function remains constant.
            </p>
            <p className="text-lg mb-6 text-black">
              For a Normal distribution with standard deviation σ, the L₂ norm
              is 1/√(2σ√π). This unique property incentivizes traders to shape
              the market's curve into an honest forecast of the true probability
              distribution.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <img
              src="/assets/graph.png"
              alt="Normal Distribution Graph"
              className="w-full rounded"
            />
          </div>
        </div>
      </section>

      {/* <section className="py-16 px-8 bg-gray-50">
        <h2 className="text-[2em] md:text-[3em] font-neueMachinaBold mb-8">
          <span className="bg-purple-500 px-4 py-2 text-white">
            Built with Modern Stack
          </span>
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-xl mb-2 text-black">Smart Contracts</h3>
            <ul className="list-disc list-inside text-black">
              <li>Solidity with Foundry</li>
              <li>OpenZeppelin Contracts</li>
              <li>PRBMath for fixed-point</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-xl mb-2 text-black">Frontend</h3>
            <ul className="list-disc list-inside text-black">
              <li>React</li>
              <li>viem & wagmi</li>
              <li>Chart.js visualization</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-xl mb-2 text-black">Infrastructure</h3>
            <ul className="list-disc list-inside text-black">
              <li>Rootstock Testnet</li>
              <li>Pyth Network Oracles</li>
              <li>ENS Integration</li>
            </ul>
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
      </section> */}

      <section className="py-32 px-8">
        <div className="grid md:grid-cols-2 gap-12 max-w-4xl items-center">
          <div>
            <p className="text-lg mb-6 text-black">Built by SeptaLabs</p>
          </div>
        </div>
      </section>
    </main>
  );
}
