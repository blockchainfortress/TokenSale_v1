pragma solidity ^0.4.4;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/PeblikToken.sol";

/** Test onlyOwner functions of the PeblikToken */
contract TestPeblikTokenOwner {

  PeblikToken token;

  function beforeAll() public {
    // create the token so this test contract is the owner
    token = new PeblikToken();
  }

  // basic check first
  function testAvailableSupply() public {
    uint256 expected = 2400000000e18 - 350000000e18 - 960000000e18;
    Assert.equal(token.availableSupply(), expected, "availableSupply should be 1,090,000,000 tokens initially");
  }


  function testDrawPublicReserve() public {
    uint256 drawAmt = 10000000e18;
    uint256 availableExpected = token.availableSupply() + drawAmt;

    token.drawFromPublicReserve(drawAmt);

    Assert.equal(token.publicReserve(), 340000000e18, "publicReserve should now be 340 million tokens");
    Assert.equal(token.availableSupply(), availableExpected, "availableSupply should now be 10 million more");
  }

  function testAddPublicReserve() public {
    uint256 addAmt = 10000000e18;
    uint256 availableExpected = token.availableSupply() - addAmt;

    token.addPublicReserve(addAmt);

    Assert.equal(token.publicReserve(), 350000000e18, "publicReserve should now be 350 million tokens");
    Assert.equal(token.availableSupply(), availableExpected, "availableSupply should now be 10 million less");
  }

  function testResourceReserve() public {
    uint256 expected = 960000000e18;
    Assert.equal(token.resourceReserve(), expected, "publicReserve should be 350 million tokens initially");
  }

  function testDrawResourceReserve() public {
    uint256 drawAmt = 10000000e18;
    uint256 availableExpected = token.availableSupply() + drawAmt;

    token.drawFromResourceReserve(drawAmt);

    Assert.equal(token.resourceReserve(), 950000000e18, "publicReserve should now be 950 million tokens");
    Assert.equal(token.availableSupply(), availableExpected, "availableSupply should now be 10 million more");
  }

  function testAddResourceReserve() public {
    uint256 addAmt = 10000000e18;
    uint256 availableExpected = token.availableSupply() - addAmt;

    token.addResourceReserve(addAmt);

    Assert.equal(token.resourceReserve(), 960000000e18, "resourceReserve should now be 960 million tokens");
    Assert.equal(token.availableSupply(), availableExpected, "availableSupply should now be 10 million less");
  }

}