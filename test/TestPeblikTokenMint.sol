pragma solidity ^0.4.4;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/PeblikToken.sol";

/** Test onlyOwner functions of the PeblikToken */
contract TestPeblikTokenMint {

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

  // STANDARD TOKEN FUNCTIONS ----------------------------

  function testMint() public {
    address beneficiary = address(0xf17f52151EbEF6C7334FAD080c5704D77216b732);

    uint mintAmt = 50e18;

    uint256 totalExpected = (token.totalSupply() + mintAmt)/1e18;

    token.mint(beneficiary, mintAmt); //50e18, or 50 full tokens

    Assert.equal(token.balanceOf(beneficiary)/1e18, 50, "Beneficiary should have 50 tokens");
    Assert.equal(token.totalSupply()/1e18, totalExpected, "totalSupply should be +50 tokens");
  }

  function testMintAfterUnpause() public {
    address beneficiary = address(0xf17f52151EbEF6C7334FAD080c5704D77216b732);

    uint mintAmt = 50e18;

    uint256 balanceExpected = (token.balanceOf(beneficiary) + mintAmt)/1e18;
    uint256 totalExpected = (token.totalSupply() + mintAmt)/1e18;

    token.mint(beneficiary, mintAmt); //50e18, or 50 full tokens

    Assert.equal(token.balanceOf(beneficiary)/1e18, balanceExpected, "Beneficiary should have +50 tokens");
    Assert.equal(token.totalSupply()/1e18, totalExpected, "totalSupply should be +50 tokens");
  }

  // EDGE CASES ---------------------

  function testDrainPublicReserve() public {
    uint256 drawAmt = 350000000e18;
    uint256 availableExpected = token.availableSupply() + drawAmt;

    token.drawFromPublicReserve(drawAmt);

    Assert.equal(token.publicReserve(), 0, "publicReserve should now be zero");
    Assert.equal(token.availableSupply(), availableExpected, "availableSupply should now be 960m + 350m");
  }

  function testMaxResourceReserve() public {
    uint256 addAmt = token.availableSupply();
    uint256 availableExpected = 0;

    token.addResourceReserve(addAmt);

    Assert.equal(token.resourceReserve(), 960000000e18 + 350000000e18 + 1090000000e18, "resourceReserve should now be 960 million tokens + 350 million + 1,090 million");
    Assert.equal(token.availableSupply(), availableExpected, "availableSupply should now be zero");
  }

}