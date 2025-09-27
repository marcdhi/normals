// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/DistributionMarket.sol";
import {SD59x18, sd} from "@prb/math/src/SD59x18.sol";

contract DistributionMarketTest is Test {
    DistributionMarket market;
    
    // Initial market parameters
    SD59x18 initialMean;
    SD59x18 initialSigma;
    SD59x18 k;
    SD59x18 b;

    function setUp() public {
        // Set initial values
        initialMean = sd(5e18);    // 5.0
        initialSigma = sd(1e18);   // 1.0
        k = sd(1e18);              // 1.0
        b = sd(1e18);              // 1.0

        market = new DistributionMarket(
            initialMean,
            initialSigma,
            k,
            b
        );
    }

    function testSuccessfulTrade() public {
        // New market parameters
        SD59x18 newMean = sd(6e18);    // 6.0
        SD59x18 newSigma = sd(2e18);   // 2.0

        // Get quote
        (uint256 requiredCollateral, SD59x18 argminX) = market.quoteCollateral(
            newMean,
            newSigma
        );

        // Execute trade with exact collateral
        vm.deal(address(this), requiredCollateral);
        market.trade{value: requiredCollateral}(
            newMean,
            newSigma,
            argminX
        );

        // Verify market state was updated
        assertEq(
            SD59x18.unwrap(market.mean()),
            SD59x18.unwrap(newMean),
            "Mean not updated correctly"
        );
        assertEq(
            SD59x18.unwrap(market.standardDeviation()),
            SD59x18.unwrap(newSigma),
            "Standard deviation not updated correctly"
        );
    }

    function testFailedTradeInsufficientCollateral() public {
        // New market parameters
        SD59x18 newMean = sd(6e18);
        SD59x18 newSigma = sd(2e18);

        // Get quote
        (uint256 requiredCollateral, SD59x18 argminX) = market.quoteCollateral(
            newMean,
            newSigma
        );

        // Try to execute trade with insufficient collateral
        uint256 insufficientCollateral = requiredCollateral / 2;
        vm.deal(address(this), insufficientCollateral);
        
        vm.expectRevert("Insufficient collateral provided");
        market.trade{value: insufficientCollateral}(
            newMean,
            newSigma,
            argminX
        );
    }

    function testFailedTradeBadArgminX() public {
        // New market parameters
        SD59x18 newMean = sd(6e18);
        SD59x18 newSigma = sd(2e18);

        // Get quote
        (uint256 requiredCollateral, SD59x18 argminX) = market.quoteCollateral(
            newMean,
            newSigma
        );

        // Modify argminX slightly to make it invalid
        SD59x18 badArgminX = argminX.add(sd(1e16)); // Add 0.01

        // Try to execute trade with incorrect argminX
        vm.deal(address(this), requiredCollateral);
        
        vm.expectRevert("Invalid minimum point");
        market.trade{value: requiredCollateral}(
            newMean,
            newSigma,
            badArgminX
        );
    }
}
