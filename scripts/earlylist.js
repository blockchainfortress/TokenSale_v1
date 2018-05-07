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
    //console.log("accounts[0]=" + accounts[0]);
    var owner = "0xe64A4a8B4d6a19C71e3D18E0C3C7e20D9E8C86Aa";

    var addresses = [
        "0x3e94590cbC02A37B95fa2bcB1F0CdECDaE431E9d", // Steve
        "0xEef705Add9dD511b2344e3b632F3EDc21d26431b", // Matt
        "0xad9428059e4086C23f1A602a2048dB834FafF294", // Kevin
        "0xe320cB37C45A29e04e4936F437977f02eDFEF22c", // Todd
        "0x81b7e08f65bdf5648606c89998a9cc8164397647", // Jag
        "0x2F19AA5a1617E568c0305e59826246A4f0453e98" // Gondour
    ];
    
    var promises = [];
    var presale;
    Presale.deployed().then(function(dep) {
        presale = dep;
        console.log("PeblikPresale: " + presale.address);

        const addToList = (addr) => {
            console.log("addr: " + addr);
            return presale.addToEarlylist(addr).then(function() { //, {from: owner}
                presale.isEarlylisted(addr).then(function(success) {
                    console.log("Added: " + addr + " = " + success);
                });
            });
        };

        addresses.forEach(element => {
            promises.push(addToList(element));
        });

        Promise.all(promises).then(function() {
            console.log("Complete.");
        });
    });
}