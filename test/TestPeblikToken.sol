pragma solidity ^0.4.4;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/PeblikToken.sol";

contract TestPeblikToken {

  PeblikToken token;

  function beforeAll() public {
    token = new PeblikToken();
  }

  function testTotalSupply() public {
    uint256 expected = 0;
    Assert.equal(token.totalSupply(), expected, "totalSupply should be 0 tokens initially");
  }

  function testInitialBalance() public {
    uint256 expected = 0;
    Assert.equal(token.balanceOf(tx.origin), expected, "Owner should have 0 tokens initially");
  }

  function testMaxSupply() public {
    uint256 expected = 2400000000e18;
    Assert.equal(token.maxSupply(), expected, "maxSupply should be 2.4 billion tokens initially");
  }

  function testAvailableSupply() public {
    uint256 expected = 2400000000e18 - 350000000e18 - 960000000e18;
    Assert.equal(token.availableSupply(), expected, "availableSupply should be 1,090,000,000 tokens initially");
  }

}