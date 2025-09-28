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
        bytes32 _priceFeedId,
        uint64 _expiry,
        address _collateralToken,
        string calldata _description,
        string calldata _lpTokenName,
        string calldata _lpTokenSymbol,
        bool _isPrivate,
        address[] calldata _initialWhitelist
    ) external {
        // 1. Deploy a new instance, passing k and b to its constructor.
        DistributionMarket newMarket = new DistributionMarket(
            _k,
            _b,
            _priceFeedId,
            _expiry,
            _lpTokenName,
            _lpTokenSymbol,
            _collateralToken
        );

        // 2. Initialize the new market with its other starting parameters.
        newMarket.initialize(_initialMean, _initialSigma, _description, _isPrivate);

        // 2b. If private and there are users to whitelist, add them
        if (_isPrivate && _initialWhitelist.length > 0) {
            newMarket.addToWhitelist(_initialWhitelist);
        }

        // 3. Store the address of the new market.
        deployedMarkets.push(address(newMarket));

        // 4. Announce that a new market has been created.
        emit MarketCreated(address(newMarket), _description);
    }

    function getDeployedMarkets() external view returns (address[] memory) {
        return deployedMarkets;
    }
}