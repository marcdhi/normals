// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {DistributionMarketFactory} from "../src/DistributionMarketFactory.sol";
import {DistributionMarket} from "../src/DistributionMarket.sol";
import {SD59x18, sd} from "@prb/math/src/SD59x18.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // --- Step 1: Deploy the Factory ---
        console.log("Deploying the DistributionMarketFactory...");
        DistributionMarketFactory factory = new DistributionMarketFactory();
        console.log("Factory deployed at address:", address(factory));

        // --- Step 2: Use the Factory to create our first market ---
        console.log("Using the factory to create the first market (BTC Price 2025)...");

        // Define the parameters for our new market
        SD59x18 initialMean = sd(70000 * 1e18);
        SD59x18 initialSigma = sd(5000 * 1e18);
        SD59x18 k = sd(1000 * 1e18);
        SD59x18 b = sd(100 * 1e18);
        string memory description = "Bitcoin (BTC) Price at end of 2025";
        
        // Pyth BTC/USD price id and expiry (Dec 31, 2025 00:00:00 UTC)
        bytes32 priceFeedId = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;
        uint64 expiry = 1767139200;
        
        // --- NEW PARAMETERS FOR THE LP TOKEN ---
        string memory lpTokenName = "Normals BTC 2025 LP Token";
        string memory lpTokenSymbol = "NORM-BTC-LP";

        // Collateral token (address(0) for native RBTC; set to RIF address for RIF markets)
        address collateralToken = address(0);

        // Call the updated createMarket function with the new arguments
        factory.createMarket(
            initialMean,
            initialSigma,
            k,
            b,
            priceFeedId,
            expiry,
            collateralToken,
            description,
            lpTokenName,
            lpTokenSymbol
        );

        // --- Step 3: Get the address of our newly created market ---
        address[] memory deployedMarkets = factory.getDeployedMarkets();
        address firstMarketAddress = deployedMarkets[0];
        console.log("First market (BTC Price 2025) deployed at address:", firstMarketAddress);
        
        vm.stopBroadcast();
    }
}