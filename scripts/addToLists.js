var Token = artifacts.require("./PeblikToken.sol");
var Presale = artifacts.require("./PeblikPresale.sol");
var TokenSale = artifacts.require("./PeblikTokenSale.sol");

module.exports = function(callback) {
    var token;
    Token.deployed().then(function(dep) {
        token = dep;
        console.log("PeblikToken: " + token.address);
        token.availableSupply().then(function(avail) {
            console.log("availableSupply = " + avail);
        });
    });
    
    var address1 = "0xfb79188d08fAe4C816652fB66484f68B029F4805"; // Account 12
    var owner = "0xe64a4a8b4d6a19c71e3d18e0c3c7e20d9e8c86aa";
    var pmtSrc = "0x0f4f2ac550a1b4e2280d04c21cea7ebd822934b5";
    var presale;
    Presale.deployed().then(function(dep) {
        
        presale = dep;
        console.log("PeblikPresale: " + presale.address);
        
        token.setController(presale.address).then(function(success) {
            token.controller().then(function(addr) {
                console.log("Set controller: " + addr);
            });
        });

        presale.addToWhitelist(address1).then(function() {
            presale.isWhitelisted(address1).then(function(success) {
                console.log("Added to whitelist: " + address1 + " = " + success);

                //const weiAmount = 1 * 1000000000000000000;
                //presale.buyTokens({ value: weiAmount, from: address1}).then(function(success) {
                //    console.log(JSON.stringify(success));
                //});
            });
        });

    });
}