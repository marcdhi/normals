// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/ERC20Token.sol";
import "../src/DistributionMarket.sol";
import {SD59x18, sd} from "@prb/math/src/SD59x18.sol";

// contract DeployERC20Token is Script {
//     function setUp() public {}

//     function run() public {
//         uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
//         vm.startBroadcast(deployerPrivateKey);

//         // Deployment with initial supply of 1,000 tokens
//         new ERC20Token(1000 * 10 ** 18);
//         vm.stopBroadcast();
//     }
// }

contract DeployDistributionMarket is Script {
    function run() external returns (DistributionMarket) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        SD59x18 initialMean = sd(70000e18);
        SD59x18 initialSigma = sd(5000e18);
        SD59x18 k = sd(1000e18);
        SD59x18 b = sd(100e18);

        DistributionMarket market = new DistributionMarket(initialMean, initialSigma, k, b);

        vm.stopBroadcast();
        return market;
    }
}
