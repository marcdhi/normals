// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// We import the type and the sd() wrapper function.
import {SD59x18, sd} from "@prb/math/src/SD59x18.sol";

contract DistributionMarket {
    // --- State Variables ---
    address public owner;
    bool public initialized;
    string public description;

    SD59x18 public mean;
    SD59x18 public standardDeviation;
    // k and b are back to being immutable!
    SD59x18 public immutable k;
    SD59x18 public immutable b;

    // --- Events ---
    event MarketUpdated(SD59x18 newMean, SD59x18 newSigma);

    // --- Constructor ---
    // The constructor now sets the immutable variables and the owner.
    constructor(SD59x18 _k, SD59x18 _b) {
        owner = msg.sender;
        k = _k;
        b = _b;
    }

    // The initializer sets the remaining variables.
    function initialize(
        SD59x18 _initialMean,
        SD59x18 _initialSigma,
        string calldata _description
    ) external {
        require(msg.sender == owner, "Only owner can initialize");
        require(!initialized, "Market already initialized");

        mean = _initialMean;
        standardDeviation = _initialSigma;
        description = _description;
        initialized = true;
    }

    // --- Core Functions ---

function quoteCollateral(
    SD59x18 newMean,
    SD59x18 newSigma
) public view returns (uint256 collateral, SD59x18 argminX) {
    SD59x18 oldMean = mean;
    SD59x18 oldSigma = standardDeviation;

    // Start our search for the minimum at the new mean
    argminX = newMean;
    
    // A small learning rate for our descent
    SD59x18 learningRate = sd(1e16); // 0.01

    // Perform a fixed number of iterations to find the minimum
    // More iterations = more accuracy, but much more gas! 10-15 is a reasonable start.
    for (uint i = 0; i < 15; i++) {
        // Calculate the derivative (the slope of the curve) at our current point
        SD59x18 deriv_g = _pdfDerivative(argminX, newMean, newSigma);
        SD59x18 deriv_f = _pdfDerivative(argminX, oldMean, oldSigma);
        SD59x18 gradient = deriv_g.sub(deriv_f);

        // Move our guess in the opposite direction of the slope
        argminX = argminX.sub(gradient.mul(learningRate));
    }

    // Now that we've found the point of minimum (argminX), calculate the value there
    SD59x18 value_g = _pdf(argminX, newMean, newSigma);
    SD59x18 value_f = _pdf(argminX, oldMean, oldSigma);
    SD59x18 minVal = value_g.sub(value_f);

    if (minVal.gte(sd(0))) {
        return (0, argminX);
    }
    
    collateral = uint256(SD59x18.unwrap(minVal.mul(sd(-1e18))));
    return (collateral, argminX);
}

 function trade(
        SD59x18 newMean,
        SD59x18 newSigma,
        SD59x18 argminX
    ) public payable {
        // 1. Verify the provided argminX and get the required collateral.
        // This is much cheaper than re-running the full quoteCollateral search.
        uint256 requiredCollateral = _verifyAndGetCollateral(
            newMean,
            newSigma,
            argminX
        );

        // 2. Check if the user has sent enough RBTC.
        require(
            msg.value >= requiredCollateral,
            "Insufficient collateral provided"
        );

        // 3. Update the market state.
        mean = newMean;
        standardDeviation = newSigma;

        // 4. Refund any excess collateral.
        if (msg.value > requiredCollateral) {
            payable(msg.sender).transfer(msg.value - requiredCollateral);
        }

        // 5. Emit an event.
        emit MarketUpdated(newMean, newSigma);
    }

    // --- Internal Math Helpers ---

    /**
     * @notice THIS IS A NEW HELPER FUNCTION.
     * It verifies that the provided argminX is a true minimum and returns the
     * collateral required at that point.
     */
    function _verifyAndGetCollateral(
        SD59x18 newMean,
        SD59x18 newSigma,
        SD59x18 argminX
    ) private view returns (uint256) {
        // Step 1: Verify the derivative is close to zero at the provided argminX
        SD59x18 oldMean = mean;
        SD59x18 oldSigma = standardDeviation;

        SD59x18 deriv_g = _pdfDerivative(argminX, newMean, newSigma);
        SD59x18 deriv_f = _pdfDerivative(argminX, oldMean, oldSigma);
        SD59x18 derivative_at_point = deriv_g.sub(deriv_f);

        // Allow a small tolerance for fixed-point math inaccuracies
        SD59x18 tolerance = sd(1e12); // 0.000001
        require(
            derivative_at_point.abs().lte(tolerance),
            "Invalid minimum point"
        );

        // Step 2: If verification passes, calculate the collateral at that point
        SD59x18 value_g = _pdf(argminX, newMean, newSigma);
        SD59x18 value_f = _pdf(argminX, oldMean, oldSigma);
        SD59x18 minVal = value_g.sub(value_f);

        if (minVal.gte(sd(0))) {
            return 0;
        }
        return uint256(SD59x18.unwrap(minVal.mul(sd(-1e18))));
    }
    


    // --- Internal Math Helpers ---

    /**
     * @notice Calculates the value of the Normal Distribution PDF at a point x.
     */
    function _pdf(
        SD59x18 x,
        SD59x18 mu,
        SD59x18 sigma
    ) private pure returns (SD59x18) {
        // Define PI as a constant (3.141592653589793238)
        SD59x18 PI = sd(3_141592653589793238);

        // 1. Calculate the exponent part: -((x - mu)^2) / (2 * sigma^2)
        SD59x18 x_minus_mu = x.sub(mu);
        SD59x18 numerator = x_minus_mu.mul(x_minus_mu).mul(sd(-1e18)); // -(x-mu)^2
        SD59x18 denominator = sd(2e18).mul(sigma.mul(sigma)); // 2*sigma^2
        SD59x18 exponent = numerator.div(denominator);

        // 2. Calculate the main coefficient: 1 / (sigma * sqrt(2 * PI))
        SD59x18 sqrt2pi = (sd(2e18).mul(PI)).sqrt();
        SD59x18 coefficient = sd(1e18).div(sigma.mul(sqrt2pi));

        // 3. Combine them: coefficient * e^(exponent)
        return coefficient.mul(exponent.exp());
    }

    /**
 * @notice Calculates the first derivative of the Normal PDF at a point x.
 * This is used to verify the point of maximum loss.
 */
function _pdfDerivative(
    SD59x18 x,
    SD59x18 mu,
    SD59x18 sigma
) private pure returns (SD59x18) {
    // The derivative is pdf(x) * -(x - mu) / sigma^2
    SD59x18 pdf_val = _pdf(x, mu, sigma);
    SD59x18 x_minus_mu = x.sub(mu);
    SD59x18 sigma_squared = sigma.mul(sigma);

    return pdf_val.mul(x_minus_mu.mul(sd(-1e18))).div(sigma_squared);
}
}
