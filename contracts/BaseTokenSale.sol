pragma solidity ^0.4.18;

import "./Pausable.sol";
import "../node_modules/zeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol";
import "./PeblikToken.sol";

/**
 * This BaseTokenSale contract already includes some non-standard token crowdsale rules, including:
 * - tokens are minted and transferred to the purchaser at the time of sale
 * - there are no refunds
 * - all purchasers must be whitelisted prior to purchase
 * - token prices are defined in US dollars (actually cents per token), as opposed to ether
 * - dollar to ether conversion rate should be managed on at least a daily basis
 * - external (non-ether) transactions can be accepted from a remote paymentSource address 
 *   (presumably representing transactions triggered after a purchase from a web-based payment provider)
 * - purchases are subject to per-transaction minimums and per-buyer maximums
 * - the sale ends when either the tokensSold cap has been reached, or the endTime has passed
 * - a manual completeSale() function must be invoked after the sale ends to trigger any post-sale processing
 */
contract BaseTokenSale is Pausable {
    using SafeMath for uint256;

    // From Crowdsale.sol --------------------

    // The token being sold
    PeblikToken public token;

    // start and end timestamps where investments are allowed (both inclusive)
    uint256 public startTime;
    uint256 public endTime;

    // address where funds are collected
    address public wallet;

    uint256 public price;

    // Customizations ------------------------

    // Address of the account from which external (non-ETH) transactions will be received.
    address public paymentSource;

    // The current conversion rate between USD and ETH, multiplied by 100
    uint256 public centsPerEth = 100000; // defaults to $1000.00

    uint256 public weiRaised;
    uint256 public centsRaised;
    uint256 public tokensSold;
    uint256 public tokenCap;

    uint256 public minCents;
    uint256 public maxCents;
    uint256 public minWei;
    uint256 public maxWei;

    bool public capReached = false;
    bool public saleComplete = false;

    //IPriceStrategy public pricing;

    // list of addresses that can purchase during the presale
    mapping (address => bool) public whitelist;

    // total bought by specific buyers - to check against max
    mapping (address => uint256) public totalPurchase;

    uint256 public whitelistCount;

    /**
    * @dev Log a token purchase.
    * @param purchaser The address that paid for the tokens
    * @param buyer The address that got the tokens
    * @param centsPaid The amount paid for purchase, in US cents
    * @param tokenAmount The amount of tokens purchased
    * @param centsRaised Total cents raised in sale so far
    * @param tokensSold The total number of tokens sold so far
    */
    event TokensBought(address indexed purchaser, address indexed buyer, uint256 centsPaid, uint256 tokenAmount, uint256 centsRaised, uint256 tokensSold);
    
    event ExternalPurchase(address indexed buyer, address indexed source, uint256 centsPaid);
    event StartTimeChanged(uint256 newTime);
    event EndTimeChanged(uint256 newTime);
    event ConversionRateChanged(uint256 newRate);
    event WalletChanged(address newWallet);
    event PaymentSourceChanged(address indexed oldSource, address indexed newSource);
    event BuyerAdded(address indexed buyer, uint256 buyerCount);
    event BuyerRemoved(address indexed buyer, uint256 buyerCount);
    event CapReached(uint256 cap, uint256 tokensSold);
    event LogPrice(uint256 tokenLevel, uint256 price);
    event ClaimedStrandedTokens(address tokenAddress, address beneficiary, uint256 tokenAmount);

    /**
     * @dev Constructor
     *
     * @param _token The address of the PeblikToken contract
     * @param _startTime The time that the main sale period begins
     * @param _endTime The time that the sale ends; after this no more purchases are possiible
     * @param _centsPerToken The initial price per token, in terms of US cents (e.g. $0.15 would be 15)
     * @param _centsPerEth The exchange rate between US cents and ether (e.g. $950.00 would be 95000)
     * @param _cap The maximum number of tokens that can be sold during the sale (no decimals, so 50000 = 50 thousand tokens)
     * @param _wallet The address of the ethereum wallet for collecting funds
     * @param _min The minimum amount required per purchase, in terms of US cents (no decimals)
     * @param _min The maximum amount that a buyer can purchase during the entire sale, in terms of US cents (no decimals)
     */
    function BaseTokenSale(address _token, uint256 _startTime, uint256 _endTime, uint256 _centsPerToken, uint256 _centsPerEth, uint256 _cap, uint256 _min, uint256 _max, address _wallet) public {
        require(_token != 0x0);
        require(_startTime >= now);
        require(_endTime >= _startTime);
        require(_centsPerToken > 0);
        require(_centsPerEth > 0);
        require(_cap > 0);
        require(_wallet != 0x0);
        require(_max > _min);

        owner = msg.sender;

        token = PeblikToken(_token);
        startTime = _startTime;
        endTime = _endTime;
        price = _centsPerToken;
        centsPerEth = _centsPerEth;
        tokenCap = _cap.mul(1e18);
        wallet = _wallet;

        changeMinMax(_min, _max);
    }

    function changeMinMax(uint256 _min, uint256 _max) internal {
        minCents = _min.mul(1e18);
        maxCents = _max.mul(1e18);

        minWei = minCents.div(centsPerEth);
        maxWei = maxCents.div(centsPerEth);
    }

    /**
     * @dev Fallback Function to buy the tokens
     */
    function () public payable {
        buyTokens();
    }

    /**
     * @dev Purchase tokens with Ether.
     */
    function buyTokens() whenNotPaused public payable { 
        require(validPurchase(msg.sender));
        
        uint256 weiAmount = msg.value;
        // get cents amount (plus 18 decimal digits)
        uint256 exactCents = weiAmount.mul(centsPerEth);

        if (!buyWithCents(exactCents, msg.sender)) {
            revert();
        }
       // only track the wei received directly by this contract
        weiRaised = weiRaised.add(weiAmount);

        // send out the funds
        wallet.transfer(weiAmount);
    }

    /**
    * @dev Allows transfer of tokens to a recipient who has purchased offline,for dollars (or other currencies converted to dollars).
    * @param _centsAmount The purchase amount in cents (dollars * 100, with no decimal place)
    * @param _buyer The address of the recipient of the tokens
    * @return bool Returns true if executed successfully.
    */
    function externalPurchase (uint256 _centsAmount, address _buyer) whenNotPaused external returns (bool) {
        require(_buyer != 0x0);
        require(validPurchase(_buyer));
        require(msg.sender == paymentSource); // transaction must come from pre-approved address

        uint256 exactCents = _centsAmount.mul(1e18);
        bool success = buyWithCents(exactCents, _buyer);

        if (success) {
            ExternalPurchase(_buyer, msg.sender, _centsAmount);
        }
        return success;
    }

    function buyWithCents(uint256 _exactCents, address _buyer) internal returns (bool success) {
        
        // check purchase history
        uint256 totalAmount = _exactCents.add(totalPurchase[_buyer]);

        if (_exactCents < minCents || totalAmount > maxCents) {
            // single purchase must meet the minimum, and total of all purchases 
            // by a single buyer cannot exceed the max
            return false;
        }

        uint256 currentPrice = getCurrentPrice(tokensSold);
        uint256 tokens = _exactCents.div(currentPrice);
        
        // mint tokens as we go
        if (!token.mint(_buyer, tokens))
        {
            return false;
        }

        // update this buyer's purchase total
        totalPurchase[_buyer] = totalAmount;

        // update sale stats
        centsRaised = centsRaised.add(_exactCents);
        tokensSold = tokensSold.add(tokens);

        TokensBought(msg.sender, _buyer, _exactCents, tokens, centsRaised, tokensSold);

        // Record that the sale cap has been reached, if applicable
        if (tokensSold >= tokenCap) {
            capReached = true;
            CapReached(tokenCap, tokensSold);

            if (tokensSold > tokenCap) {
                token.drawFromPublicReserve(tokensSold.sub(tokenCap));
            } 
        }
        
        return true;
    }

    /**
    * Checks whether a buyer can participate in the sale and if the sale is still running.
    * @param _buyer The address of the buyer
    * @return true If the buyer's transaction can continue
    */
    function validPurchase(address _buyer) internal view returns (bool) {
        if (now >= startTime && now <= endTime && !capReached) {
            // in main sale period
            if (isWhitelisted(_buyer)) {
                return true;
            } 
        }
        return false;
    }

    /**
    * Officially shut down the sale.
    */
    function completeSale () public onlyOwner {
        require(!saleComplete); 
        require(capReached || now > endTime);

        saleComplete = true;
    }

    /**
    * Change the start time of the sale. For example, to delay it.
    * @param _newTime The time stamp for the sale starting time.
    */
    function changeStartTime (uint256 _newTime) public onlyOwner {
        require(_newTime < endTime); 
        require(_newTime > now);
        require(now < startTime);
        require(!saleComplete);

        startTime = _newTime;
        StartTimeChanged(_newTime);
    }

    /**
    * Change the end time of the sale. For example, to extend it.
    * @param _newTime The time stamp for the sale ending time.
    */
    function changeEndTime (uint256 _newTime) public onlyOwner {
        require(_newTime > startTime); 
        require(_newTime > now);
        require(!saleComplete);

        endTime = _newTime;
        EndTimeChanged(_newTime);
    }

    /**
    * @dev Change the ETH USD exchange rate. To be set twice daily during the sale.
    * @param _newRate The current USD per ETH rate, multiplied by 100
    */
    function changeConversionRate (uint256 _newRate) public onlyOwner {
        require(_newRate >= 1000 && _newRate <= 10000000); // sanity check
        require(!saleComplete);

        centsPerEth = _newRate;

        // keep min/max in sync
        minWei = minCents.div(centsPerEth);
        maxWei = maxCents.div(centsPerEth);

        ConversionRateChanged(centsPerEth);
    }

    /**
    * @dev Change the wallet that's used to collect funds.
    * @param _newWallet The address of the new wallet to use.
    */
    function changeWallet (address _newWallet) public onlyOwner {
        require(_newWallet != 0); 
        require(!saleComplete);

        wallet = _newWallet;
        WalletChanged(_newWallet);
    }

    /**
    * @dev Change the address from which external payments can be sent.
    * @param _newSource The address of the new wallet to use.
    */
    function changePaymentSource (address _newSource) public onlyOwner {
        require(_newSource != 0x0); 
        require(!saleComplete);
        address oldSource = paymentSource;
        paymentSource = _newSource;
        PaymentSourceChanged(oldSource, _newSource);
    }

    // MANAGE WHITELISTS ----------------------------------------------------

    function addToWhitelist(address _buyer) public onlyOwner {
        require(!saleComplete);
        require(_buyer != 0x0);
        whitelist[_buyer] = true;
        whitelistCount++;
        BuyerAdded(_buyer, whitelistCount);
    }

    function removeFromWhitelist(address _buyer) public onlyOwner {
        require(!saleComplete);
        require(_buyer != 0x0 && whitelist[_buyer]);
        whitelist[_buyer] = false; 
        whitelistCount = whitelistCount.sub(1);
        BuyerRemoved(_buyer, whitelistCount);
    }

    // @return true if buyer is whitelisted
    function isWhitelisted(address _buyer) public view returns (bool) {
        return whitelist[_buyer];
    }

    /**
    * Caclulates the effective price for a sale transaction.
    *
    * @param _tokensSold The total tokens sold in the sale so far
    * @return The effective price (in term of price per token)
    */
    function getCurrentPrice(uint256 _tokensSold) public view returns (uint256 pricePerToken) {
        return price;
    }

    /**
     * @dev In case someone accidentally sends other ERC20 tokens to this contract,
     * add a way to get them back out.
     * @param _token The address of the type of token that was received.
     * @param _to The address to which to send the stranded tokens.
     * @param _amount The amount of stranded tokens to claim.
     */
    function claimStrandedTokens(address _token, address _to, uint256 _amount) public onlyOwner returns (bool) { 
        require(_token != 0x0);
        require(_to != 0x0);
        require(_amount > 0);
        
        ERC20Basic strandedToken = ERC20Basic(_token);
        require(_amount <= strandedToken.balanceOf(this));

        if (strandedToken.transfer(_to, _amount)) {
            ClaimedStrandedTokens(_token, _to, _amount);
            return true;
        }
        return false;
    }

    // -----------------------------------------------------------
    /** Testing functions, for test script and debugging use. **/
    /** These will be removed from the production contracts before deploying to mainnet. */
    /*
    function calcTokens(uint256 weiAmount) public view returns (uint256 value) {
        uint256 currentPrice = getCurrentPrice(tokensSold);
        uint256 exactCents = weiAmount.mul(centsPerEth);
        return exactCents.div(currentPrice);
    }
    
    function calcCentsToTokens(uint256 centsAmount) public view returns (uint256 value) {
        uint256 currentPrice = getCurrentPrice(tokensSold);
        uint256 tokens = centsAmount.mul(1 ether).div(currentPrice);

        return tokens;
    }
    */
}