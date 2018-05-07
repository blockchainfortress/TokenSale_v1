var PeblikToken = artifacts.require("PeblikToken");

contract('PeblikToken', function(accounts) {

    const owner1 = accounts[0];
    const owner2 = accounts[1];
    const buyer1 = accounts[2];
    const buyer2 = accounts[3];
    const buyer3 = accounts[4];
    const buyer4 = accounts[5];
    const pmtSrc = accounts[6];
    const wallet1 = accounts[7];
    const wallet2 = accounts[8];

    let tokenContract;

    before('setup contracts for all tests', async function () {
        // cache instances of the contracts for use in all the tests
        PeblikToken.deployed().then(async function (tokenInstance) {
            tokenContract = tokenInstance;

            const addr = tokenContract.address;
            //console.log("token contract address = " + addr);   
        });
    });


    it('should start non-transferable', async function() {
        try {
            const isTransferable = await tokenContract.transferable.call();
            //console.log(isTransferable);
            assert.equal(isTransferable, false, 'Token should not be trasnferable at the start');
        } catch (error) {
            console.log(error);
        }

    });

    it('should mint tokens and send to recipient', async function(){
        try {
            const tokenAmount = 20 * 1000000000000000000;
            const totalExpected = (await tokenContract.totalSupply()).toNumber() + tokenAmount;
            const balanceExpected = (await tokenContract.balanceOf(owner2)).toNumber() + tokenAmount;
            //console.log(totalExpected);
            //console.log(balanceExpected);
            await tokenContract.mint(owner2, tokenAmount).then((result) => { //50e18, or 50 full tokens
                //console.log(result);
                for (var i = 0; i < result.logs.length; i++) {
                    var log = result.logs[i];
                    //console.log(log);
                    RecordLog(log);
                }
                //utils.assertEvent(presaleContract, { event: "Mint", logIndex: 0, args: { to: buyer1, amount: 1000000000000000000 }})
             }); 
            
            const totalSupply = await tokenContract.totalSupply();
            const balance = await tokenContract.balanceOf(owner2);
            //console.log(totalSupply);
            //console.log(balance);
            //console.log("totalExpected: " + totalExpected + " totalSupply: " + totalSupply);
            //console.log("balanceExpected: " + balanceExpected + " balance: " + balance);    
            assert.equal(balance.toNumber(), balanceExpected, 'Balance did not increase correctly');
            assert.equal(totalSupply.toNumber(), totalExpected, 'Total supply did not increase correctly');          

        } catch (error) {
            console.log(error);
        }
    });
  
    /** Need to catch the revert () in the following test */
   
    it('should not be able to transfer tokens yet', async function(){
        const tokenAmount = 20 * 1000000000000000000;
        const sender = owner2; 
        const recipient = buyer1; 

        try {
            const balanceExpected = (await tokenContract.balanceOf(recipient)).toNumber();
            //console.log(balanceExpected);
            try {
                await tokenContract.transfer(recipient, tokenAmount, {from: sender}).then((result) => { //50e18, or 50 full tokens
                    //console.log(result);
                    for (var i = 0; i < result.logs.length; i++) {
                        var log = result.logs[i];
                        //console.log(log);
                        RecordLog(log);
                    }
                    //utils.assertEvent(presaleContract, { event: "Mint", logIndex: 0, args: { to: buyer1, amount: 1000000000000000000 }})
                 });                  
            } catch (error) {
                //console.log(error);
            }
            
            const balance = await tokenContract.balanceOf(recipient);
            //console.log(balance);    
            assert.equal(balance.toNumber(), balanceExpected, 'Recipient balance should not have changed');        

        } catch(error) {
            console.log(error);
        }
    });
    
    it('should make token transferable', async function(){
        try {
            await tokenContract.setTransferable();
            const isTransferable = await tokenContract.transferable.call();
            assert.equal(isTransferable, true, 'Token should now be transferable');
        } catch (error) {
            console.log(error);
        }
    });

    it('should now be able to transfer tokens', async function(){
        const tokenAmount = 20 * 1000000000000000000;
        const sender = owner2; 
        const recipient = buyer1; 
       
        try {
            const senderBalanceExpected = (await tokenContract.balanceOf.call(sender)).toNumber() - tokenAmount;
            const balanceExpected = (await tokenContract.balanceOf.call(recipient)).toNumber() + tokenAmount;

            await tokenContract.transfer(recipient, tokenAmount, {from: sender}).then((result) => { 
                //console.log(result);
                for (var i = 0; i < result.logs.length; i++) {
                    var log = result.logs[i];
                    //console.log(log);
                    RecordLog(log);
                }
                //utils.assertEvent(presaleContract, { event: "Mint", logIndex: 0, args: { to: buyer1, amount: 1000000000000000000 }})
             });                   
            
            const senderBalance = await tokenContract.balanceOf.call(sender);
            const balance = await tokenContract.balanceOf.call(recipient);
            assert.equal(senderBalance.toNumber(), senderBalanceExpected, 'Sender balance should have decreased by ' + tokenAmount);;                
            assert.equal(balance.toNumber(), balanceExpected, 'Recipient balance should have increased by ' + tokenAmount);             
        } catch (error) {
            console.log(error);
        }
    });

    it('can change the controller', async function(){
        try {
            await tokenContract.setController(wallet1).then((result) => { // not the real contract address -- just for testing
                //console.log(result);
                for (var i = 0; i < result.logs.length; i++) {
                    var log = result.logs[i];
                    //console.log(log);
                    RecordLog(log);
                }
                //utils.assertEvent(presaleContract, { event: "Mint", logIndex: 0, args: { to: buyer1, amount: 1000000000000000000 }})
             });                    
            const controllerAddr = await tokenContract.controller.call();
            assert.equal(controllerAddr, wallet1, 'Controller address does not match');
        } catch (error) {
            console.log(error);
        }
    });

    it('transfer Ownership', async function(){
        try {
            var ownerAddr = await tokenContract.owner.call();
            assert.equal(ownerAddr, owner1, 'transfer Ownership - owers does not match');
            await tokenContract.transferOwnership(owner2).then((result) => { // not the real contract address -- just for testing
                //console.log(result);
                for (var i = 0; i < result.logs.length; i++) {
                    var log = result.logs[i];
                    //console.log(log);
                    RecordLog(log);
                }
                //utils.assertEvent(presaleContract, { event: "Mint", logIndex: 0, args: { to: buyer1, amount: 1000000000000000000 }})
             });                    
             ownerAddr = await tokenContract.owner.call();
             assert.equal(ownerAddr, owner1, 'transfer Ownership - owers does not match');
            } catch (error) {
            console.log(error);
        }
    });

    it('accept Ownership', async function(){
        try {
            var ownerAddr = await tokenContract.owner.call();
            assert.equal(ownerAddr, owner1, 'accept Ownership - owers does not match');
            await tokenContract.acceptOwnership({from: owner2}).then((result) => { // not the real contract address -- just for testing
                //console.log(result);
                for (var i = 0; i < result.logs.length; i++) {
                    var log = result.logs[i];
                    //console.log(log);
                    RecordLog(log);
                }
                //utils.assertEvent(presaleContract, { event: "Mint", logIndex: 0, args: { to: buyer1, amount: 1000000000000000000 }})
             });                    
             ownerAddr = await tokenContract.owner.call();
             assert.equal(ownerAddr, owner2, 'accept Ownership - owers does not match');
            } catch (error) {
            console.log(error);
        }
    });

    it('transfer Ownership Fail', async function(){
        try {
            var ownerAddr = await tokenContract.owner.call();
            assert.equal(ownerAddr, owner2, 'transfer Ownership Fail - owers does not match');
            try {
                await tokenContract.transferOwnership(owner1).then((result) => { // not the real contract address -- just for testing
                    //console.log(result);
                    for (var i = 0; i < result.logs.length; i++) {
                        var log = result.logs[i];
                        //console.log(log);
                        RecordLog(log);
                    }
                    //utils.assertEvent(presaleContract, { event: "Mint", logIndex: 0, args: { to: buyer1, amount: 1000000000000000000 }})
                 });               
            } catch (error) {
                console.log("transfer Ownership Fail - Transfer Failed");
            }
                    
             ownerAddr = await tokenContract.owner.call();
             assert.equal(ownerAddr, owner2, 'transfer Ownership Fail - owers does not match');
            } catch (error) {
            console.log(error);
        }
    });

    it('transfer Ownership back', async function(){
        try {
            var ownerAddr = await tokenContract.owner.call();
            assert.equal(ownerAddr, owner2, 'transfer Ownership back- owers does not match');
            await tokenContract.transferOwnership(owner1, {from: owner2}).then((result) => { // not the real contract address -- just for testing
                //console.log(result);
                for (var i = 0; i < result.logs.length; i++) {
                    var log = result.logs[i];
                    //console.log(log);
                    RecordLog(log);
                }
                //utils.assertEvent(presaleContract, { event: "Mint", logIndex: 0, args: { to: buyer1, amount: 1000000000000000000 }})
             });               

                    
             ownerAddr = await tokenContract.owner.call();
             assert.equal(ownerAddr, owner2, 'transfer Ownership back - owers does not match');
            } catch (error) {
            console.log(error);
        }
    });

    it('accept Ownership back', async function(){
        try {
            var ownerAddr = await tokenContract.owner.call();
            assert.equal(ownerAddr, owner2, 'accept Ownership back - owers does not match');
            await tokenContract.acceptOwnership({from: owner1}).then((result) => { // not the real contract address -- just for testing
                //console.log(result);
                for (var i = 0; i < result.logs.length; i++) {
                    var log = result.logs[i];
                    //console.log(log);
                    RecordLog(log);
                }
                //utils.assertEvent(presaleContract, { event: "Mint", logIndex: 0, args: { to: buyer1, amount: 1000000000000000000 }})
             });                    
             ownerAddr = await tokenContract.owner.call();
             assert.equal(ownerAddr, owner1, 'accept Ownership back - owers does not match');
            } catch (error) {
            console.log(error);
        }
    });

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
      
    function RecordLog(log) {
        switch (log.event) {
            case "TokensBought": {
                console.log("Event:" + " " + log.event + ": " + log.args.tokenAmount.toNumber() + " by " + log.args.buyer + " purchaser " + log.args.purchaser + " centsPaid: " + log.args.centsPaid.toNumber());
            }
            case "CapReached": {
                console.log("Event:" + " " + log.event + ": " + log.args.tokensSold.toNumber() + " >= " + log.args.cap);
                break;
            }
            case "ExternalPurchase": {
                console.log("Event:" + " " + log.event + ": by " + log.args.buyer + " payment source " + log.args.source + " centsPaid: " + log.args.centsPaid.toNumber());
                break;
            }
            case "Mint": {
                console.log("Event:" + " " + log.event + ": " + log.args.amount.toNumber() + " by " + log.args.to);
                break;
            }
            case "Transfer": {
                console.log("Event:" + " " + log.event + ": " + log.args.value.toNumber() + " from " + log.args.from + " to " + log.args.to);
                break;
            }
            case "NonTransferable": {
                console.log("Event:" + " " + log.event + ": " + log.args.value.toNumber() + " from " + log.args.from + " to " + log.args.to);
                break;
            }
            case "StartTimeChanged": {
                console.log("Event:" + " " + log.event + ": " + log.args.newTime.toNumber());
                break;
            }
            case "EndTimeChanged": {
                console.log("Event:" + " " + log.event + ": " + log.args.newTime.toNumber());
                break;
            }
            case "ConversionRateChanged": {
                console.log("Event:" + " " + log.event + ": " + log.args.newRate.toNumber());
                break;
            }
            case "WalletChanged": {
                console.log("Event:" + " " + log.event + ": " + log.args.newWallet);
                break;
            }            
            case "ControllerChanged": {
                console.log("Event:" + " " + log.event + ": oldAddress " + log.args.oldAddress + " " + log.args.newAddress);
                break;
            }            
            case "PublicReserveAdded":
            case "ResourceReserveAdded":
            case "PublicReserveDrawn":
            case "ResourceReserveDrawn": {
                console.log("Event:" + " " + log.event + ": amount " + log.args.amount);
                break;
            } 
            case "Pause": 
            case "Unpause":                       
            case "MintFinished": {
                console.log("Event:" + " " + log.event);
                break;
            } 
            case "OwnershipTransferred": {
                console.log("Event:" + " " + log.event + ": previousOwner " + log.args.previousOwner + " newOwner " + log.args.newOwner);
                break;
            } 
            default: {
                //console.log(log.event);
                console.log(log);
                break;
            }
        }
    }
});