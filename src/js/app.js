App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // Initialize web3 and set the provider to the testRPC.
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      console.log("no current provider");
      // set the provider you want from Web3.providers
      App.web3Provider = new web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(App.web3Provider);
    }
    //console.log("provider: " + App.web3Provider.path);
    return App.initContract();
  },

  initContract: function() {
    $.getJSON('PeblikToken.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract.
      var PeblikTokenArtifact = data;
      App.contracts.PeblikToken = TruffleContract(PeblikTokenArtifact);

      // Set the provider for our contract.
      App.contracts.PeblikToken.setProvider(App.web3Provider);

      // Use our contract to show the current account's balance
      return App.getBalances();
    });

    return App.bindEvents();
    //return App.watchEvents();
  },

  bindEvents: function() {
    $(document).on('click', '#transferButton', App.handleTransfer);
    $(document).on('click', '#mintButton', App.handleMint);
    $(document).on('click', '#burnButton', App.handleBurn);
  },
  // watch events isnt working
  watchEvents: function() {
    var PeblikTokenInstance;

    App.contracts.PeblikToken.deployed().then(function(instance) {
      PeblikTokenInstance = instance;
      instance.Mint().watch(function(error, result) {
        if (!error)
        {
            $('#Status').text("Mint event: " + result.args.amount + " tokens minted.");
        } else {
            console.log(error);
        }
      })
    })
  },

  handleTransfer: function() {
    event.preventDefault();

    var amount = parseFloat($('#TransferAmount').val());
    if (amount < 1000000)
    {
      amount *= 1000000000000000000;
    }
    var toAddress = $('#TransferAddress').val();

    console.log('Transfer ' + amount + ' PeblikTokens to ' + toAddress);

    var PeblikTokenInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      // select main default account
      var account = accounts[0];

      App.contracts.PeblikToken.deployed().then(function(instance) {
        PeblikTokenInstance = instance;

        return PeblikTokenInstance.transfer(toAddress, amount, {from: account});
      }).then(function(result) {
        alert('Transfer Successful!');
        return App.getBalances();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  handleMint: function() {
    event.preventDefault();

    var amount = parseInt($('#MintAmount').val());
    // This token has 18 decimal places
    if (amount < 1000000)
    {
      amount *= 1000000000000000000;
    }
    var toAddress = $('#MintAddress').val();

    console.log('Mint ' + amount + ' PeblikToken for ' + toAddress);

    var PeblikTokenInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      // select main default account
      var account = accounts[0];
      console.log('...from: ' + account);

      App.contracts.PeblikToken.deployed().then(function(instance) {
        PeblikTokenInstance = instance;

        return PeblikTokenInstance.mint(toAddress, amount, {from: account});
      }).then(function(result) {
        PeblikTokenInstance.Mint().watch(function(error, result) {
          if (!error)
          {
              console.log(result.args);
              var minted = result.args.amount / 1000000000000000000;
              $('#Status').text("Mint event: " + minted + " tokens minted.");
          } else {
              console.log(error);
          }
        });
        //alert('Mint transaction submitted');
        //return App.getBalances();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  handleBurn: function() {
    event.preventDefault();

    var amount = parseInt($('#BurnAmount').val());
    if (amount < 1000000)
    {
      amount *= 1000000000000000000;
    }

    console.log('Burn ' + amount + ' PeblikToken.');

    var PeblikTokenInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      // select main default account
      var account = accounts[0];

      App.contracts.PeblikToken.deployed().then(function(instance) {
        PeblikTokenInstance = instance;

        return PeblikTokenInstance.burn(amount, {from: account});
      }).then(function(result) {
        alert('Burned ' + amount + ' PeblikToken! :(');
        return App.getBalances();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },
// TODO: watch events; figure out why avail supply isn't going down
  getBalances: function(adopters, account) {
    console.log('Getting balances...');

    var PeblikTokenInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];
      $('#AcctAddress').text(account);

      App.contracts.PeblikToken.deployed().then(function(instance) {
        PeblikTokenInstance = instance;

        return PeblikTokenInstance.totalSupply();
      }).then(function(result) {

        var supply = result / 1000000000000000000; // 18 decimal places
        $('#TotalSupply').text(supply);

        return PeblikTokenInstance.availableSupply();
      }).then(function(result) {

        var avail = result / 1000000000000000000; // 18 decimal places
        $('#AvailSupply').text(avail);

        return PeblikTokenInstance.balanceOf(account);
      }).then(function(result) {
        balance = result / 1000000000000000000; // 18 decimal places

        $('#AcctBalance').text(balance);
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
