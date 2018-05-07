var Token = artifacts.require("./PeblikToken.sol");
var Presale = artifacts.require("./PeblikPresale.sol");
var TokenSale = artifacts.require("./PeblikTokenSale.sol");

module.exports = function(callback) {

    var owner = "0xe64A4a8B4d6a19C71e3D18E0C3C7e20D9E8C86Aa";
    var newRate = 40000;
    var presale;

    Presale.deployed().then(function(dep) {
        presale = dep;
        console.log("PeblikPresale: " + presale.address);

        presale.changeConversionRate(newRate).then(function() { 
            presale.centsPerEth().then(function(rate) {
                console.log("New Rate: " + rate);
            });
        });
    });
}