pragma solidity ^0.4.18;

import "./MintableToken.sol";

contract PeblikToken is MintableToken {

    string public name = "Peblik Token";
    string public symbol = "PBLK";
    uint256 public decimals = 18;

    /* Address of the current contract that's allowed to call mint() and other functions */
    address public controller;

    /* The maximum number of tokens that can ever be in circulation. */
    uint256 public maxSupply = 2400000000e18; // 2.4 billion tokens max

    /* Reserved for future issuance to the public, when new resource assets are acquired as backing */
    uint256 public publicReserve = 350000000e18; // 350,000,000 tokens

    /* Reserved for future use to help purchase new resources as backing */
    uint256 public resourceReserve = 960000000e18; // 960,000,000 tokens

    /* The maximum amount of supply that can be issued at the current time: 
     * maxSupply - totalSupply - publicReserve - resourceReserve = availableSupply */
    uint256 public availableSupply = 1090000000e18; // starts as 2.4b - 350m - 960m

    event PublicReserveAdded(uint256 amount);
    event ResourceReserveAdded(uint256 amount);
    event PublicReserveDrawn(uint256 amount);
    event ResourceReserveDrawn(uint256 amount);
    event ControllerChanged(address indexed oldAddress, address indexed newAddress);
    event ClaimedStrandedTokens(address tokenAddress, address beneficiary, uint256 tokenAmount);

    function PeblikToken() public {
        totalSupply_ = 0;
    }

    /* After the original future allocation has all been issued, if new assets are acquired for the underlying pool, 
     * the future allocation pool may be increased (and possibly issued to the public), as long as the value of the new 
     * underlying assets exceeds the market value of the new supply. */
    function addPublicReserve(uint256 _publicSupply) public onlyOwner whenTransferable {
        require(_publicSupply > 0);
        require(availableSupply >= _publicSupply);

        availableSupply = availableSupply.sub(_publicSupply);
        publicReserve = publicReserve.add(_publicSupply);
        PublicReserveAdded(_publicSupply);
    }

    /* @dev If the company wants to acquire new resource assets, it can draw from Resource Acquisition reserves
     * to make tokens available for use when purchasing assets. 
     *
     * @param _drawAmount Amount of tokens to pull from the reserve into available token supply (includes 18 decimals)
     */
    function drawFromPublicReserve(uint256 _drawAmount) public onlyOwnerOrController { //onlyOwner
        require(_drawAmount > 0);
        require(publicReserve >= _drawAmount);

        publicReserve = publicReserve.sub(_drawAmount);
        availableSupply = availableSupply.add(_drawAmount);
        PublicReserveDrawn(_drawAmount);
    }

    /* @dev After the original resource allocation has all been issued, if new assets are acquired for the underlying pool, 
     * the resource acquisition reserve may be increased, as long as the value of the new 
     * underlying assets exceeds the market value of the new supply. */
    function addResourceReserve(uint256 _resourceSupply) public onlyOwner whenTransferable {
        require(_resourceSupply > 0);
        require(availableSupply >= _resourceSupply);

        availableSupply = availableSupply.sub(_resourceSupply);
        resourceReserve = resourceReserve.add(_resourceSupply);
        ResourceReserveAdded(_resourceSupply);
    }

    /* @dev If the company wants to acquire new resource assets, it can draw from Resource Acquisition reserves
     * to make tokens available for use when purchasing assets. 
     *
     * @param _drawAmount Amount of tokens to pull from the reserve into available token supply.
     */
    function drawFromResourceReserve(uint256 _drawAmount) public onlyOwner {
        require(_drawAmount > 0);
        require(resourceReserve >= _drawAmount);

        resourceReserve = resourceReserve.sub(_drawAmount);
        availableSupply = availableSupply.add(_drawAmount);
        ResourceReserveDrawn(_drawAmount);
    }

    /**
    * @dev Override the mint function to check against and update available supply.
    * @param _to The address that will receive the minted tokens.
    * @param _amount The amount of tokens to mint.
    * @return A boolean that indicates if the operation was successful.
    */
    function mint(address _to, uint256 _amount) public onlyOwnerOrController canMint returns (bool) { 
        if (_amount >= availableSupply) 
        {
            return false;
        }

        totalSupply_ = totalSupply_.add(_amount);
        availableSupply = availableSupply.sub(_amount);
        balances[_to] = balances[_to].add(_amount);

        Mint(_to, _amount);
        Transfer(address(0), _to, _amount);
        return true;
    }

    /**
     * @dev In case someone accidentally sends other ERC20 tokens to this contract,
     * add a way to get them back out.
     * @param _token The address of the type of token that was received.
     * @param _to The address to which to send the stranded tokens.
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

    /**
     * @dev Throws if called by any account other than the owner or controller.
     */
    modifier onlyOwnerOrController() {
        require(msg.sender == controller || msg.sender == owner);
        _;
    }

    /**
     * @dev Throws if called by any account other than the controller.
     */
    modifier onlyController() {
        require(msg.sender == controller);
        _;
    }

    /**
     * @dev Authorizes an address (normally another contract) that can mint tokens and 
     * change a subset of token properties.
     * @param _newController The address to authorize
     */
    function setController(address _newController) public onlyOwner {
        require(_newController != 0x0);
        address oldController = controller;
        controller = _newController;
        ControllerChanged(oldController, controller);
    }

    /**
     * De-authorizes the current controller address.
     */
    function clearController() external onlyOwner {
        address oldController = controller;
        controller = address(0);
        ControllerChanged(oldController, controller);
    }
}