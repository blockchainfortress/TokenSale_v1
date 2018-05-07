pragma solidity ^0.4.18;

import "./Ownable.sol";
import "../node_modules/zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

contract TransferableToken is StandardToken, Ownable  { //is PausableToken

    bool public transferable;

    event Transferable();
    event NonTransferable();

    /**
    * @dev Modifier to make a function callable only when the contract is not paused.
    */
    modifier whenNonTransferable() {
        require(!transferable);
        _;
    }

    /**
    * @dev Modifier to make a function callable only when the contract is paused.
    */
    modifier whenTransferable() {
        require(transferable);
        _;
    }

    /**
    * @dev called by the owner to pause, triggers stopped state
    */
    function setTransferable() onlyOwner whenNonTransferable public {
        transferable = true;
        Transferable();
    }

    // Override standard transfer functions

    function transfer(address _to, uint256 _value) public whenTransferable returns (bool) {
        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint256 _value) public whenTransferable returns (bool) {
        return super.transferFrom(_from, _to, _value);
    }

    function approve(address _spender, uint256 _value) public whenTransferable returns (bool) {
        return super.approve(_spender, _value);
    }

    function increaseApproval(address _spender, uint _addedValue) public whenTransferable returns (bool success) {
        return super.increaseApproval(_spender, _addedValue);
    }

    function decreaseApproval(address _spender, uint _subtractedValue) public whenTransferable returns (bool success) {
        return super.decreaseApproval(_spender, _subtractedValue);
    }

}