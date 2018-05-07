var Token = artifacts.require("./PeblikToken.sol");
var Presale = artifacts.require("./PeblikPresale.sol");
var TokenSale = artifacts.require("./PeblikTokenSale.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(Token).then(function() {
      console.log("PeblikToken deployed at " + Token.address);

      var dt = new Date();
      dt.setDate(dt.getDate());

      const earlyTime = Math.round((dt.getTime())/1000); // one second in the future
      //const startTime = earlyTime + 1800; // 30 minutes in the future
      const startTime = earlyTime + 60; // 60 seconds in the future
      const endTime = startTime + 5400; // 90 minutes after start
          
      const centsPerToken = 15;
      const centsPerEth = 90000; // $900
      const weiAmount = 1000000000000000000;
      const cap = 100000;
      const minAmount =    9000; // $    90 =  0.1 eth
      const maxAmount = 1800000; // $18,000 = 20.0 eth

      console.log("Token Address: " + Token.address + " earlyTime: " + earlyTime  + " startTime: " + startTime + " endTime: " + endTime + " centsPerToken: " + centsPerToken 
      + " centsPerEth: " + centsPerEth + " cap: " + cap + " minAmount: " + minAmount + " maxAmount: " + minAmount + " wallet: " + accounts[7]);
    
      deployer.deploy(Presale, Token.address, earlyTime, startTime, endTime, centsPerToken, centsPerEth, cap, minAmount, maxAmount, accounts[7]).then(function () {
        console.log("PeblikPresale deployed at " + Presale.address);
        
        //return Token.setController(Presale.address).then(function () {
        //  console.log("Controller set to " + Token.controller());
        //})
      });

      const startTokenTime = Math.round((dt.getTime())/1000) + 1800; // 30 minutes in the future
      const endTokenTime = startTokenTime + 5400; // 90 minutes after start
      
      const thresholds = [0,50000,100000,150000];
      const prices = [25,35,45,50];

      const newCap = 200000;

      return deployer.deploy(TokenSale, Token.address, startTokenTime, endTokenTime, centsPerToken, centsPerEth, newCap, minAmount, maxAmount, accounts[7], thresholds, prices).then(function () { 
        console.log("PeblikTokenSale deployed at " + TokenSale.address);

        //return Token.setController(Presale.address).then(function () {
        //  console.log("Controller set to " + Token.controller());
        //})
        
      });
      
  });
};
/*
module.exports = function(deployer, network, accounts) {};*/