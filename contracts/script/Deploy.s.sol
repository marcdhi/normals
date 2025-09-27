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
        // CORRECTED SYNTAX: Use `value * 10**18` for whole numbers
        SD59x18 initialMean = sd(70000 * 1e18);
        SD59x18 initialSigma = sd(5000 * 1e18);
        SD59x18 k = sd(1000 * 1e18);
        SD59x18 b = sd(100 * 1e18);
        string memory description = "Bitcoin (BTC) Price at end of 2025";

        // Call the createMarket function
        factory.createMarket(initialMean, initialSigma, k, b, description);

        // --- Step 3: Get the address of our newly created market ---
        address[] memory deployedMarkets = factory.getDeployedMarkets();
        address firstMarketAddress = deployedMarkets[0];
        console.log("First market (BTC Price 2025) deployed at address:", firstMarketAddress);
        
        vm.stopBroadcast();
    }
}