// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {SD59x18} from "@prb/math/src/SD59x18.sol";
import {DistributionMarket} from "./DistributionMarket.sol";

contract DistributionMarketFactory {
    address[] public deployedMarkets;

    event MarketCreated(address indexed marketAddress, string description);

    // The function now accepts _k and _b to create a unique market
    function createMarket(
        SD59x18 _initialMean,
        SD59x18 _initialSigma,
        SD59x18 _k,
        SD59x18 _b,
        string calldata _description
    ) external {
        // 1. Deploy a new instance, passing k and b to its constructor.
        DistributionMarket newMarket = new DistributionMarket(_k, _b);

        // 2. Initialize the new market with its other starting parameters.
        newMarket.initialize(_initialMean, _initialSigma, _description);

        // 3. Store the address of the new market.
        deployedMarkets.push(address(newMarket));

        // 4. Announce that a new market has been created.
        emit MarketCreated(address(newMarket), _description);
    }

    function getDeployedMarkets() external view returns (address[] memory) {
        return deployedMarkets;
    }
}