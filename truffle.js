var HDWalletProvider = require("truffle-hdwallet-provider");

var infura_apikey = "3AAKWTHrDduclzDBE9iK";
var mnemonic = "couple people wagon rely voyage amazing click sauce claim meadow corn unusual";

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 4710000 // note that 47100000 is barely enough -- need to cut down contract size
      //gas: 4800000 // 47100000 is the max for Ropsten and Mainnet
    },
    azure: {
      host: "nooc4oyz7.westus2.cloudapp.azure.com",
      port: 8545,
      network_id: "*"//,
      //from: "0xe64A4a8B4d6a19C71e3D18E0C3C7e20D9E8C86Aa"
      //, gas: 4710000
    },
    ropsten: {
      provider: new HDWalletProvider(mnemonic, "https://ropsten.infura.io/" + infura_apikey),
      network_id: 3
      //, from: "0x23F8cB20eFb5410a37A121218cB2c3d0dF3d026A"
      , gasPrice: 10000000000
      , gas: 4600000
    },
    mainnet: {
     // provider: new HDWalletProvider(mnemonic, "https://mainnet.infura.io/" + infura_apikey),
     // network_id: 1
     // , from: "0x23F8cB20eFb5410a37A121218cB2c3d0dF3d026A"
     // , gas: 4710000
    }
  }
};
