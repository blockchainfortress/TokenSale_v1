pragma solidity ^0.4.18;

import "../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "./BaseTokenSale.sol";

 /**
 * Manages the public crowdsale of Peblik Tokens. In addition to all the rules defined in the BaseTokenSale superclass:
 * - defines additional wallets for transferring fund allocation after the sale ends
 * - supports a multiple-level pricing scheme where price levels are based on token sale thresholds
 */
contract PeblikTokenSale is BaseTokenSale {
    using SafeMath for uint256;

    // Customizations ------------------------
    struct PriceLevel {
        uint256 threshold;
        uint256 dollarPrice;
    }
    PriceLevel[] public levels;

    event PriceLevelsChanged(uint256 numLevelsAdded);

    // additional wallets where token allocations go after the sale
    address public employeePoolWallet;
    address public advisorPoolWallet;
    address public bountyProgramWallet;

    // NOTE: we await a decision about whether these amounts need to be changeable 
    uint256 public employeePoolAmount = 360000000e18;
    uint256 public advisorPoolAmount = 120000000e18;
    uint256 public bountyProgramAmount = 120000000e18;

    event EmployeeWalletChanged(address newWallet); 
    event AdvisorWalletChanged(address newWallet); 
    event BountyWalletChanged(address newWallet); 
    event SaleComplete(uint256 totalSupply); 

    /**
     * @dev Constructor
     *
     * @param _token The address of the PeblikToken contract
     * @param _startTime The time that the main sale period begins
     * @param _endTime The time that the sale ends; after this no more purchases are possiible
     * @param _centsPerToken The initial price per token, in terms of US cents (e.g. $0.15 would be 15)
     * @param _centsPerEth The exchange rate between US cents and ether (e.g. $950.00 would be 95000)
     * @param _cap The maximum number of tokens that can be sold duringg the sale.
     * @param _wallet The address of the ethereum wallet for collecting funds
     * @param _min The minimum amount required per purchase, in terms of US cents
     * @param _max The maximum amount that a buyer can purchase during the entire sale, in terms of US cents
     * @param _thresholds An array of tokens-sold amounts that trigger new price levels
     * @param _prices An array of price-per-token values corresponding to the sales thresholds
     */
    function PeblikTokenSale(address _token, uint256 _startTime, uint256 _endTime, uint256 _centsPerToken, uint256 _centsPerEth, uint256 _cap, uint256 _min, uint256 _max, address _wallet, uint256[] _thresholds, uint256[] _prices) 
                BaseTokenSale(_token, _startTime,  _endTime, _centsPerToken, _centsPerEth, _cap, _min, _max, _wallet) public {

        changePriceLevels(_thresholds, _prices);
    }

    /**
     * @dev Override completeSale to also mint tokens for post-sale allocations.
     */
    function completeSale () public onlyOwner {
        super.completeSale();

        // allocate and transfer all allocations to other wallets
        if (!token.mint(employeePoolWallet, employeePoolAmount)) {
            revert();
        }
        if (!token.mint(advisorPoolWallet, advisorPoolAmount)) {
            revert();
        }
        if (!token.mint(bountyProgramWallet, bountyProgramAmount)) {
            revert();
        }
        SaleComplete(token.totalSupply());
    }

    /**
    * @dev Change the wallet used for the employee pool. (This should be directed to an employee vesting contract).
    * @param _newWallet The address of the new wallet to use.
    */
    function changeEmployeePoolWallet (address _newWallet) public onlyOwner {
        require(_newWallet != 0); 
        require(!saleComplete);

        employeePoolWallet = _newWallet;
        EmployeeWalletChanged(_newWallet);
    }

    /**
    * @dev Change the wallet used for the advisor pool. (This should be directed to a token vesting contract).
    * @param _newWallet The address of the new wallet to use.
    */
    function changeAdvisorPoolWallet (address _newWallet) public onlyOwner {
        require(_newWallet != 0); 
        require(!saleComplete);

        advisorPoolWallet = _newWallet;
        AdvisorWalletChanged(_newWallet);
    }

    /**
    * @dev Change the wallet used for the Bounty Program. 
    * (This may go to a smart contract that manages the progam; or just to a multisig wwallet used to disburse funds).
    * @param _newWallet The address of the new wallet to use.
    */
    function changeBountyProgramWallet (address _newWallet) public onlyOwner {
        require(_newWallet != 0); 
        require(!saleComplete);

        bountyProgramWallet = _newWallet;
        BountyWalletChanged(_newWallet);
    }

    // --------------------- PRICING ---------------------

    /**
     * @dev Change the price per token for the all phases of the sale.
     * @param _thresholds An array of tokens-sold amounts that trigger new price levels
     * @param _prices An array of price-per-token values corresponding to the sales thresholds
     */
    function changePriceLevels(uint256[] _thresholds, uint256[] _prices) public onlyOwner { 
        require(_thresholds.length > 0 && _thresholds.length <= 4); // array must contain elements
        require(_thresholds.length == _prices.length); // arrays must have same number of entries
        require(_thresholds[0] == 0); // must have a default level

        uint256 prevAmount = 0;
        // Loops are costly, but  the length of the array is limited so we can live with it.
        delete levels;
           
        for (uint8 i = 0; i < _thresholds.length; i++) {          
            // Check that all thresholds are increasing
            if (_thresholds[i] < prevAmount) {
                revert();
            }
            // Prices must be non-zero
            if (_prices[i] <= 0) {
                revert();
            }
            prevAmount = _thresholds[i];
            levels.push(PriceLevel(_thresholds[i] * 1e18, _prices[i]));
            LogPrice(_thresholds[i], _prices[i]);
        }
        PriceLevelsChanged(levels.length);
    }

    /**
    * Caclulates the effective price for a sale transaction.
    *
    * @param _tokensSold The total tokens sold in the sale so far (with 18 decimals)
    * @return The effective price (in term of price per token)
    */
    function getCurrentPrice(uint256 _tokensSold) public view returns (uint256 pricePerToken) {
        require(_tokensSold >= 0);

        uint256 index;
        for (index = levels.length - 1; index >= 0; index--) {
           
            // Find the highest threshold that's been passed.
            // Note that this should always succeed for level[0], since that threshold should always be zero.
            if (_tokensSold >= levels[index].threshold) {
                return levels[index].dollarPrice;
            }
        }
        return levels[0].dollarPrice;
    }
}