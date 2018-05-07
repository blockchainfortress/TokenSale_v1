# Peblik Token Smart Contracts

Solidity smart contracts and administrative web pages for the Peblik Token, presale, and public sale.

## Token and Sale Requirements

The smart contracts are being built to satisfy the requirements outlined in the Peblik Smart Contract Requirements document: 
https://docs.google.com/spreadsheets/d/1M0LcgZJ7VVuSVRivU5XYfb8RdwNDWxvdOtP2MCVdF5k/edit#gid=908547091

Here is a short list of the requirements at the time of this writing (updated 12 Feb 2018):

* R-001 PeblikToken contract MUST follow ERC-20 standard
* R-002 Define token name; symbol; totalSupply
* R-003 Future allocation pool of 350 million to be reserved for later issuance.
* R-004 Resource acquisition pool of 960 million to be reserved for future use
* R-005 MUST be able to withdraw Ether or tokens inadvertently sent to the token contract.
* R-007 Token sale has 3 phases: private placement; pre-sale; public sale
* R-008 MUST be able to issue tokens for people who paid with fiat during private placement
* R-009 Private placement buyers MUST be KYC-whitelisted prior to receiving tokens
* R-010 Private placement will sell 120 mln tokens at $0.05 or $0.10 each
* R-011 Pre-Sale will sell 50 mln tokens at $0.15 each
* R-012 Pre-sale participants must be whitelisted prior to purchase
* R-013 Pre-Sale minimum is US$1,000 (~1 ETH); maximum is US$200,000 (~200 ETH)
* R-014 Pre-sale closes after a purchase takes it over 120 mln tokens sold; or after 2 weeks
* R-015 MIGHT enable an Early Bird pre-sale phase to give a random subset a first chance at buying
* R-016 Public sale will sell 200 million tokens at prices from $0.25 to $0.50 each
* R-017 Public sale uses 4 level discount scheme based on total tokens sold
* R-018 Public sale runs until all 200 mln tokens are sold or for 4 weeks (unless time is extended).
* R-019 If public sale ends before reaching 200 mln cap unsold tokens go to the Future Allocation pool.
* R-020 Token price per ETH will be set at start of Presale and daily therafter
* R-021 Only direct ETH contributions will be accepted during the Presale
* R-022 During Public Sale contributions will be accepted in other cryptocurrencies as well
* R-023 MUST be able to pause Presale and Public Sale in case of emergency
* R-024 Listenable events should happen for each purchase during Presale and Public Sale
* R-025 Listenable events should happen when token supply or allocations change
* R-026 Listenable events should happen when Presale or Public Sale state changes
* R-027 MUST be able to extend closing dates for Presale or Public Sale
* R-029 When public sale closes MUST send 480 million tokens to team and advisors vesting contract
* R-030 After public sale closes MUST send tokens to biz dev partners and bounty participants.
* R-031 During Presale forward funds from contract to multisig funds collection wallet
* R-032 During public sale forward funds to multisig funds collection wallet
* R-033 Public sale participants MUST be whitelisted prior to purchasing 
* R-034 After public sale owner MUST finalize sale triggering token distribution to other allocations
* R-035 Multi-signature wallet must be available for holding fund collected during presale.
* R-036 Multi-signature wallet must be available for holding fund collected during public sale.
* R-037 Multi-signature wallet must be able to hold Peblik Tokens for future allocations
* R-038 Multi-signature wallet allows 3 or more owners and 3 or more signers
* R-040 Tokens MUST not be tradable until the public sale is complete.

## Build Notes

This project uses Truffle and Node.js. You'll want to install the following node modules to get things working:

To install the OpenZeppelin base contracts:
```
npm install zeppelin-solidity
```
To use Infura.io networks:
```
npm install truffle-hdwallet-provider
```
To run the web interface locally, first install the lite server: 
```
npm install lite-server
```
Then run it: 
```
npm run dev
```