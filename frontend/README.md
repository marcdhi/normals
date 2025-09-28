# Normals

**Bitcoins first distribution market.**

Normals is a novel decentralized prediction market platform built on **Rootstock**, allowing users to trade on the full probability distribution of an event's outcome, rather than just a binary "yes/no".

---

- **Live Demo:** `[LINK TO YOUR VERCEL DEPLOYMENT]`
- **Video Walkthrough:** `[LINK TO YOUR YOUTUBE DEMO]`

---

## The Problem with Prediction Markets Today

Current prediction markets are powerful, but they are stuck in a binary world. They can answer "Will X happen?" but they can't answer the most important, nuanced questions like:

-   "What will the **price of Bitcoin** actually be on December 31st, 2025?"
-   "What is the **range of likely outcomes** and how confident is the market?"

This limits their use for sophisticated financial forecasting and risk management.

## Our Solution: Normals

Inspired by the "Distribution Markets" paper by Paradigm, Normals is a new kind of Automated Market Maker (AMM) where the core asset being traded is the **entire probability curve**.

Instead of a single price point, our market aggregates the predictions of all traders into a visual, collective forecast—a Normal distribution curve that anyone can see, challenge, and trade against. We bring this cutting-edge DeFi primitive to the Bitcoin ecosystem by building on Rootstock.

## Key Features

* **Full Distribution Trading:** Don't just place a bet. Trade the entire probability curve for any continuous outcome. Express complex views like "I think the price will be around $75k, but with very high certainty (a skinny curve)."
* **Live Visual AMM:** An intuitive, real-time interface where you can physically see and shape the market's consensus. Our chart shows your proposed trade and your potential profit/loss profile *before* you commit, thanks to our on-chain quoting function.
* **Permissionless Market Creation:** Our decentralized factory contract allows anyone to create a new, customized prediction market for any asset with a **Pyth Network** price feed.
* **Earn Real Yield on Bitcoin:** Provide liquidity to our novel AMM using a single asset (**RBTC** or **RIF**) and earn fees from all trading activity, bringing new yield opportunities to the Bitcoin ecosystem.
* **Private Markets with ENS:** Creators can make markets private and use **ENS names** to manage a whitelist of allowed participants, perfect for syndicated groups or private funds.

## How It Works: The Math

The core of Normals is a constant function AMM with an $L_2$ norm invariant, specialized for Normal distributions.

#### The AMM Invariant
Unlike Uniswap's `x*y=k`, our invariant ensures that the "total size" of the market's probability function remains constant. For a Normal distribution with standard deviation $\sigma$, the $L_2$ norm is $1 / \sqrt{2\sigma\sqrt{\pi}}$. This unique property incentivizes rational traders to shape the market's curve into an honest forecast of the true probability distribution.

#### On-Chain Collateral Calculation
To provide a gas-efficient and accurate quote, we use a two-step process:

1.  **Quoting (`quoteCollateral`):** Our `view` function performs a fast, on-chain **gradient descent search** (15 iterations) to find the `argminX`—the point of maximum potential loss for a proposed trade. This gives the user an accurate collateral requirement before they transact.
2.  **Trading (`trade`):** The user's transaction includes the `argminX` found during the quote. The `trade` function then uses our `_verifyAndGetCollateral` helper to cheaply verify that the derivative at `argminX` is near zero, confirming it's a valid minimum before accepting the trade. This "off-chain calculation, on-chain verification" pattern is both secure and efficient.

## Tech Stack & Sponsor Integrations

We are proud to build within the ETHGlobal ecosystem and leverage our sponsors' technology:

* **Blockchain:** **Rootstock**
    * We chose Rootstock to bring this advanced DeFi primitive to the security and liquidity of the Bitcoin ecosystem. All our smart contracts are deployed on the Rootstock Testnet.
* **Smart Contracts:**
    * **Solidity** with the **Foundry** development framework.
    * **OpenZeppelin Contracts** for a secure ERC20 implementation for our LP tokens.
    * **PRBMath** for safe, high-precision fixed-point math.
* **Oracles:** **Pyth Network**
    * Our markets are designed to be resolved using Pyth's reliable, high-frequency price feeds. Our factory allows creators to select any asset with a Pyth feed.
* **Multi-Collateral Support:** **RIF Token**
    * To support the Rootstock economy, our factory can create markets that use either **RBTC** or **RIF** as the primary collateral asset.
* **Identity:** **Ethereum Name Service (ENS)**
    * Our private market feature uses ENS to create user-friendly access lists, allowing creators to whitelist participants using their `.eth` names.
* **Frontend:**
    * **React**
    * **viem** & **wagmi** for robust blockchain interaction.
    * **Chart.js** for our live, interactive visualizations.

## Getting Started (Local Setup)

#### Contracts (Backend)
1.  `cd contracts`
2.  `forge install`
3.  `cp .env.example .env` and add your `PRIVATE_KEY`.
4.  `forge test` to run the test suite.
5.  `forge script script/Deploy.s.sol ...` to deploy.

#### Frontend
1.  `cd frontend`
2.  `yarn`
3.  Update the contract addresses in `src/lib/web3Config.js`.
4.  `yarn dev` to start the local server.

## What's Next

* **Expanded Market Types:** Support for different distributions (e.g., Lognormal) and non-financial markets (e.g., sports, elections).
* **Full Positions Management:** A comprehensive UI for users to manage and close multiple trade "legs" at once.
* **DAO Governance:** Transitioning the ownership of the factory and its fee switches to a decentralized autonomous organization.
