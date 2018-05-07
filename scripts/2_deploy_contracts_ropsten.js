var Token = artifacts.require("./PeblikToken.sol");
var Presale = artifacts.require("./PeblikPresale.sol");
var TokenSale = artifacts.require("./PeblikTokenSale.sol");

module.exports = function(deployer, network, accounts) {
    const owner = accounts[0]; //'0x627306090abaB3A6e1400e9345bC60c78a8BEf57';
    //const wallet = '0x204afab6451928583637a16d75a34c22d3cd52ba'; // test wallet
    deployer.deploy(Token).then(function() {
        console.log("PeblikToken deployed at " + Token.address);

        var dt = new Date();
        dt.setDate(dt.getDate());

        const earlyTime = Math.round((dt.getTime())/1000); // one second in the future
        const startTime = earlyTime + 36000; // 10 hours in the future
        const endTime = startTime + 86400; // 24 hours after start
            
        const weiAmount = 1000000000000000000;
        const centsPerToken = 15;
        const centsPerEth = 40000; // $400
        const cap = 1000000;       // 1m tokens
        const minAmount =   1000;  // $   10
        const maxAmount = 200000;  // $2,000

        var token;
        Token.deployed().then(function(dep) {
            token = dep;
            console.log("Ropsten PeblikToken: " + token.address);
            token.owner().then(function(own) {
                console.log("owner = " + own);
                token.availableSupply().then(function(avail) {
                    console.log("availableSupply = " + avail);
                })
                .catch(function(err) {
                    console.log('error:' + err);
                }) ;
            });
        });

        console.log("Token Address: " + Token.address + " earlyTime: " + earlyTime  + " startTime: " + startTime + " endTime: " + endTime + " centsPerToken: " + centsPerToken 
        + " centsPerEth: " + centsPerEth + " cap: " + cap + " minAmount: " + minAmount + " maxAmount: " + minAmount + " wallet: " + accounts[7]);
        
        deployer.deploy(Presale, Token.address, earlyTime, startTime, endTime, centsPerToken, centsPerEth, cap, minAmount, maxAmount, accounts[7]).then(function () {
            console.log("PeblikPresale deployed at " + Presale.address);
            
            token.setController(Presale.address, {from: owner}).then(function () {
                token.controller().then(function(controlAddr) {
                    console.log("controller = " + controlAddr);
                });
            });
            
        });
    /*
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
       */
    });
    
};