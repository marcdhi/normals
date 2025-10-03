// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// We import the type and the sd() wrapper function.
import {SD59x18, sd} from "@prb/math/src/SD59x18.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// The contract now IS an ERC20 token
contract DistributionMarket is ERC20 {
    // --- State Variables ---
    address public owner;
    bool public initialized;
    string public description;
    // --- NEW STATE VARIABLES FOR PRIVATE MARKETS ---
    bool public isPrivate;
    mapping(address => bool) public isWhitelisted;

    SD59x18 public mean;
    SD59x18 public standardDeviation;
    // k and b are back to being immutable!
    SD59x18 public immutable k;
    SD59x18 public immutable b;

    // Pyth price feed identifier (32-byte id) and market expiry timestamp (unix seconds)
    bytes32 public immutable priceFeedId;
    uint64 public immutable expiry;

    // --- NEW STATE VARIABLE ---
    uint256 public totalCollateral; // Tracks total collateral held in the pool

    // Collateral token address: address(0) means native SOL; otherwise ERC20 token (e.g., SOL)
    address public immutable collateralToken;

    // --- NEW DATA STRUCTURES FOR POSITIONS ---
    struct Term {
        SD59x18 mean;
        SD59x18 sigma;
    }

    struct Leg {
        Term oldTerm;
        Term newTerm;
        bool isOpen;
    }

    // Mapping from user to their position legs
    mapping(address => Leg[]) public positionLegs;

    // --- Events ---
    event MarketUpdated(SD59x18 newMean, SD59x18 newSigma);

    // --- Constructor ---
    // The constructor now accepts the immutable values AND the ERC20 name/symbol.
    constructor(
        SD59x18 _k,
        SD59x18 _b,
        bytes32 _priceFeedId,
        uint64 _expiry,
        string memory _lpTokenName,
        string memory _lpTokenSymbol,
        address _collateralToken
    ) ERC20(_lpTokenName, _lpTokenSymbol) { // This part sets up the ERC20 token
        owner = msg.sender;
        k = _k;
        b = _b;
        priceFeedId = _priceFeedId;
        expiry = _expiry;
        collateralToken = _collateralToken;
    }

    // The initializer sets the remaining variables.
    function initialize(
        SD59x18 _initialMean,
        SD59x18 _initialSigma,
        string calldata _description,
        bool _isPrivate
    ) external {
        require(msg.sender == owner, "Only owner can initialize");
        require(!initialized, "Market already initialized");

        mean = _initialMean;
        standardDeviation = _initialSigma;
        description = _description;
        isPrivate = _isPrivate;
        initialized = true;
    }

    // --- Liquidity Functions ---

    function addLiquidity(uint256 collateralAmount) external payable {
        if (isPrivate) {
            require(isWhitelisted[msg.sender], "Not whitelisted for this private market");
        }
        require(collateralAmount > 0, "Must provide collateral");
        _receiveCollateral(collateralAmount);

        uint256 sharesToMint;
        uint256 totalSupply_ = totalSupply(); // Get total LP shares from ERC20

        if (totalSupply_ == 0) {
            // First LP gets 1:1 shares
            sharesToMint = collateralAmount;
        } else {
            sharesToMint = (collateralAmount * totalSupply_) / totalCollateral;
        }

        require(sharesToMint > 0, "Insufficient amount for shares");

        // Update the total collateral in the pool
        totalCollateral += collateralAmount;

        // Mint the new LP shares directly to the provider
        _mint(msg.sender, sharesToMint);
    }

    function removeLiquidity(uint256 sharesToBurn) external {
        uint256 totalSupply = totalSupply();
        require(sharesToBurn > 0, "Must burn at least one share");
        require(totalSupply > 0, "Pool is empty");

        // Calculate the amount of collateral this user is entitled to.
        uint256 collateralToReturn = (sharesToBurn * totalCollateral) / totalSupply;

        // Update the total collateral in the pool
        totalCollateral -= collateralToReturn;

        // Burn the user's LP shares
        _burn(msg.sender, sharesToBurn);

        // Send the collateral back to them
        _sendCollateral(msg.sender, collateralToReturn);
    }

    /**
     * @notice Calculates how many LP shares would be minted for a given collateral amount.
     * This is a read-only function for the frontend to get a preview.
     */
    function quoteAddLiquidity(
        uint256 collateralAmount
    ) external view returns (uint256 sharesToMint) {
        if (collateralAmount == 0) {
            return 0;
        }

        uint256 totalSupply = totalSupply();

        if (totalSupply == 0) {
            // For the first provider, shares minted equals collateral provided.
            sharesToMint = collateralAmount;
        } else {
            // For subsequent providers, mint proportionally.
            sharesToMint = (collateralAmount * totalSupply) / totalCollateral;
        }

        return sharesToMint;
    }

    // --- Core Functions ---

function quoteCollateral(
    SD59x18 newMean,
    SD59x18 newSigma
) public view returns (uint256 collateral, SD59x18 argminX) {
    SD59x18 oldMean = mean;
    SD59x18 oldSigma = standardDeviation;

    // --- THIS IS THE FIX ---
    // Instead of starting at the newMean (where the gradient might be zero),
    // we start one standard deviation to the side to ensure our search begins on a slope.
    argminX = newMean.add(oldSigma);
    
    // A small learning rate for our descent
    SD59x18 learningRate = sd(1e16); // 0.01

    // Perform a fixed number of iterations to find the minimum
    // The rest of the function is perfect and does not need to change.
    for (uint i = 0; i < 15; i++) {
        SD59x18 deriv_g = _pdfDerivative(argminX, newMean, newSigma);
        SD59x18 deriv_f = _pdfDerivative(argminX, oldMean, oldSigma);
        SD59x18 gradient = deriv_g.sub(deriv_f);
        argminX = argminX.sub(gradient.mul(learningRate));
    }

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
        if (isPrivate) {
            require(isWhitelisted[msg.sender], "Not whitelisted for this private market");
        }
        SD59x18 oldMean = mean;
        SD59x18 oldSigma = standardDeviation;
        // 1. Verify the provided argminX and get the required collateral.
        // This is much cheaper than re-running the full quoteCollateral search.
        uint256 requiredCollateral = _verifyAndGetCollateral(
            newMean,
            newSigma,
            argminX
        );
        
        // 2. Receive collateral (native or ERC20). Enforces exact msg.value for native.
        _receiveCollateral(requiredCollateral);

        // Add the trader's posted collateral to the pool's total
        totalCollateral += requiredCollateral;

        // 3. Update the market state.
        mean = newMean;
        standardDeviation = newSigma;

        // 4. Emit an event.
        emit MarketUpdated(newMean, newSigma);

        // 5. Store leg for user's position history
        _storeLeg(oldMean, oldSigma, newMean, newSigma);
    }

    // --- Whitelist Management ---
    function addToWhitelist(address[] calldata users) external {
        require(msg.sender == owner, "Only owner can add to whitelist");
        for (uint i = 0; i < users.length; i++) {
            isWhitelisted[users[i]] = true;
        }
    }

    // --- Collateral handling helpers ---
    function _receiveCollateral(uint256 amount) private {
        if (collateralToken == address(0)) {
            require(msg.value == amount, "Incorrect SOL amount sent");
        } else {
            require(msg.value == 0, "Do not send SOL to a token market");
            IERC20(collateralToken).transferFrom(msg.sender, address(this), amount);
        }
    }

    function _sendCollateral(address to, uint256 amount) private {
        if (collateralToken == address(0)) {
            payable(to).transfer(amount);
        } else {
            IERC20(collateralToken).transfer(to, amount);
        }
    }

    // Store a new position leg for msg.sender
    function _storeLeg(
        SD59x18 oldMean,
        SD59x18 oldSigma,
        SD59x18 newMean,
        SD59x18 newSigma
    ) private {
        positionLegs[msg.sender].push(
            Leg({
                oldTerm: Term({mean: oldMean, sigma: oldSigma}),
                newTerm: Term({mean: newMean, sigma: newSigma}),
                isOpen: true
            })
        );
    }

    /**
     * @notice Returns the count of position legs for a user
     */
    function getPositionLegCount(address user) external view returns (uint256) {
        return positionLegs[user].length;
    }

    /**
     * @notice Returns a position leg in a simple tuple form for easy frontend decoding
     */
    function getPositionLeg(address user, uint256 index)
        external
        view
        returns (
            SD59x18 oldMean,
            SD59x18 oldSigma,
            SD59x18 newMean,
            SD59x18 newSigma,
            bool isOpen
        )
    {
        Leg memory leg = positionLegs[user][index];
        return (
            leg.oldTerm.mean,
            leg.oldTerm.sigma,
            leg.newTerm.mean,
            leg.newTerm.sigma,
            leg.isOpen
        );
    }

    /**
     * @notice Quotes the cost to close a single position leg.
     * "Closing" means trading from the CURRENT market state back to the state BEFORE the leg was created.
     */
    function quoteClosePosition(uint256 legIndex)
        external
        view
        returns (uint256 collateral, SD59x18 argminX, SD59x18 expectedRefund)
    {
        require(legIndex < positionLegs[msg.sender].length, "Invalid leg index");
        Leg memory legToClose = positionLegs[msg.sender][legIndex];
        require(legToClose.isOpen, "Leg is already closed");

        // Target is the state BEFORE that leg was created
        SD59x18 targetMean = legToClose.oldTerm.mean;
        SD59x18 targetSigma = legToClose.oldTerm.sigma;

        // Quote collateral from current state to target state
        (collateral, argminX) = quoteCollateral(targetMean, targetSigma);

        // Simplified expected refund estimate
        (uint256 riskBefore, ) = quoteCollateral(legToClose.newTerm.mean, legToClose.newTerm.sigma);
        if (riskBefore > collateral) {
            expectedRefund = sd(int256(riskBefore - collateral));
        } else {
            expectedRefund = sd(0);
        }
        return (collateral, argminX, expectedRefund);
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
