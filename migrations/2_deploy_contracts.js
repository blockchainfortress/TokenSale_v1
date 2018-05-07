var Token = artifacts.require("./PeblikToken.sol");
var Presale = artifacts.require("./PeblikPresale.sol");
var TokenSale = artifacts.require("./PeblikTokenSale.sol");

module.exports = function(deployer, network, accounts) {
    const owner = accounts[0]; //'0x627306090abaB3A6e1400e9345bC60c78a8BEf57';
    const wallet = '0x204afab6451928583637a16d75a34c22d3cd52ba'; // test multi-sig wallet
 
    var dt = new Date();
    dt.setDate(dt.getDate());

    const earlyTime = Math.round((dt.getTime())/1000) + 1200; // 20 minutes in the future to allow for network delays
    //const startTime = earlyTime + 1800; // 30 minutes in the future
    const startTime = earlyTime + 84600; // 24 hours minus 30 minutes in the future
    const endTime = startTime + 432000; // 5 days after start
        
    const weiAmount = 1000000000000000000;
    const centsPerToken = 15;
    const centsPerEth = 40000; // $400
    const cap = 1000000; // 1m tokens
    const minAmount =   1000; // $   10
    const maxAmount = 200000; // $2,000

    const tokenAddr = "0x54ef532dd5c3c537d9da2528cb3774faa1217581";

    console.log("Token Address: " + tokenAddr + " earlyTime: " + earlyTime  + " startTime: " + startTime + " endTime: " + endTime + " centsPerToken: " + centsPerToken 
    + " centsPerEth: " + centsPerEth + " cap: " + cap + " minAmount: " + minAmount + " maxAmount: " + minAmount + " wallet: " + wallet);
    

    deployer.deploy(Presale, tokenAddr, earlyTime, startTime, endTime, centsPerToken, centsPerEth, cap, minAmount, maxAmount, wallet).then(function () {
        console.log("PeblikPresale deployed at " + Presale.address);
        
        /*token.setController(Presale.address, {from: owner}).then(function () {
            token.controller().then(function(controlAddr) {
                console.log("controller = " + controlAddr);
            });
        });
        */
    }).catch(function(err) {
        console.log(err.message);
    });
};