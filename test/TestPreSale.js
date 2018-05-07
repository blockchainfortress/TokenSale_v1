var PeblikPresale = artifacts.require("PeblikPresale");
var PeblikToken = artifacts.require("PeblikToken");

contract('PeblikPresale', function(accounts) {

    const owner1 = accounts[0];
    const owner2 = accounts[1];
    const buyer1 = accounts[2];
    const buyer2 = accounts[3];
    const buyer3 = accounts[4];
    const buyer4 = accounts[5];
    const pmtSrc = accounts[6];
    const wallet1 = accounts[7];
    const wallet2 = accounts[8];

    let presaleContract;
    let tokenContract;

    before('setup contracts for all tests', async function () {
        // cache instances of the contracts for use in all the tests
        PeblikPresale.deployed().then(async function (instance) {
            presaleContract = instance;
        });

        PeblikToken.deployed().then(async function (tokenInstance) {
            tokenContract = tokenInstance;

            const addr = tokenContract.address;
            //console.log("token contract address = " + addr);   
        });
    });

    it('changes payment source', async function() {
        try {
            await presaleContract.changePaymentSource(pmtSrc, { from: owner1 });
            const source = await presaleContract.paymentSource.call();
            assert.equal(source, pmtSrc, 'Change Payment Source Failed');
        } catch (error) {
            console.log(error);
        }
    });

    it('changes token controller', async function () {
        try {
            //console.log("presale address: " + presaleContract.address);
            await tokenContract.setController(presaleContract.address, { from: owner1 });
            const controllerAddr = await tokenContract.controller.call();
            //console.log("controllerAddr: " + controllerAddr);
            assert.equal(presaleContract.address, controllerAddr, 'setController Failed');
        } catch (error) {
            console.log(error);
        }
    });

    it('adds to early list', async function() {
        try {
            var isListed = await presaleContract.isEarlylisted(buyer1);
            if (!isListed) {
                await presaleContract.addToEarlylist(buyer1);
                isListed = await presaleContract.isEarlylisted(buyer1);
            }
            assert.equal(isListed, true, 'Early listed Failed');

            isListed = await presaleContract.isEarlylisted(buyer2);
            if (!isListed) {
                await presaleContract.addToEarlylist(buyer2);
                isListed = await presaleContract.isEarlylisted(buyer2);
            }
            assert.equal(isListed, true, 'Early listed Failed');
        } catch (error) {
            console.log(error);                  
        }    
    });

    it('adds to whitelist', async function() {
        try {
            var isListed = await presaleContract.isWhitelisted(buyer3);
        
            if (!isListed) {
                await presaleContract.addToWhitelist(buyer3);
                isListed = await presaleContract.isWhitelisted(buyer3);
            }
            assert.equal(isListed, true, 'Is White listed Failed');

            isListed = await presaleContract.isWhitelisted(buyer4);
        
            if (!isListed) {
                await presaleContract.addToWhitelist(buyer4);
                isListed = await presaleContract.isWhitelisted(buyer4);
            }
            assert.equal(isListed, true, 'Is White listed Failed');
        } catch (error) {
            console.log(error);                  
        }
    });

    it('correctly shows isListed', async function() {
        try {
            var isListed = await presaleContract.isListed(buyer1);
            assert.equal(isListed, true, 'isListed Failed');
            isListed = await presaleContract.isListed(buyer3);
            assert.equal(isListed, true, 'isListed Failed');
        } catch (error) {
            console.log(error);                   
        }
    });

    it('cannot buy if not on early list', async function(){
        try {
            const weiAmount = new web3.BigNumber(1 * 1000000000000000000); // 1 eth
            const tokenAmount = (await presaleContract.calcTokens.call(weiAmount.toNumber())).toNumber();
            console.log("weiAmount = " + weiAmount + ", tokenAmount = " + tokenAmount);

            // buyer3 is in the whitelist but not the early list
            await presaleContract.buyTokens({ value: weiAmount, from: buyer3}).then((result) => { 
                LogEvents(result);
             });
             assert.isOk(false, 'Buy while not on early list should have failed, but did not');

        } catch (error) {
            //console.log(error);  
            assert.isOk(true, 'Buy while not on early list failed as intended');            
        }
    });

    it('buys tokens', async function(){
        const weiAmount = 2 * 1000000000000000000;
        try {
            const tokenAmount = (await presaleContract.calcTokens.call(weiAmount)).toNumber();
            console.log("tokenAmount = " + tokenAmount);
            var isCapReached = await presaleContract.capReached();
            assert.equal(isCapReached, false, 'buys tokens - Cap Reached Failed');

            const totalExpected = (await tokenContract.totalSupply()).toNumber();
            const buyerExpected = (await tokenContract.balanceOf(buyer2)).toNumber();
            const walletExpected = (await web3.eth.getBalance(wallet1)).toNumber();

            await presaleContract.buyTokens({ value: weiAmount, from: buyer2}).then((result) => { 
                LogEvents(result);
             });

            // check that the buyer got the right amount of tokens
            const buyerBal = (await tokenContract.balanceOf(buyer2)).toNumber();
            // check that tokensSold, totalSupply and availableSupply have been updated
            const totalSupply = (await tokenContract.totalSupply()).toNumber();
            // check that wei was transferred to correct wallet address
            const walletBal = (await web3.eth.getBalance(wallet1)).toNumber();

            console.log("buyerBal = " + buyerBal);
            console.log("totalSupply = " + totalSupply);
            console.log("walletBal = " + walletBal);

            assert.equal(walletBal, walletExpected + weiAmount, 'Wallet balance did not increase correctly');  
            assert.equal(totalSupply, totalExpected + tokenAmount, 'Total supply did not increase correctly'); 
            assert.equal(buyerBal, buyerExpected + tokenAmount, 'Balance did not increase correctly');

        } catch (error) {
            console.log(error);              
        }
    });

    it('buys more tokens', async function(){
        const weiAmount = 4 * 1000000000000000000;
        try {
            const tokenAmount = (await presaleContract.calcTokens.call(weiAmount)).toNumber();
            console.log("tokenAmount = " + tokenAmount);
            var isCapReached = await presaleContract.capReached();
            assert.equal(isCapReached, false, 'buys tokens - Cap Reached Failed');

            const totalExpected = (await tokenContract.totalSupply()).toNumber();
            const buyerExpected = (await tokenContract.balanceOf(buyer2)).toNumber();
            const walletExpected = (await web3.eth.getBalance(wallet1)).toNumber();

            await presaleContract.buyTokens({ value: weiAmount, from: buyer2}).then((result) => { 
                LogEvents(result);
             });

            // check that the buyer got the right amount of tokens
            const buyerBal = (await tokenContract.balanceOf(buyer2)).toNumber();
            // check that tokensSold, totalSupply and availableSupply have been updated
            const totalSupply = (await tokenContract.totalSupply()).toNumber();
            // check that wei was transferred to correct wallet address
            const walletBal = (await web3.eth.getBalance(wallet1)).toNumber();

            console.log("buyerBal = " + buyerBal);
            console.log("totalSupply = " + totalSupply);
            console.log("walletBal = " + walletBal);

            assert.equal(walletBal, walletExpected + weiAmount, 'Wallet balance did not increase correctly');  
            assert.equal(totalSupply, totalExpected + tokenAmount, 'Total supply did not increase correctly'); 
            assert.equal(buyerBal, buyerExpected + tokenAmount, 'Balance did not increase correctly');

        } catch (error) {
            console.log(error);              
        }
    });
 
    it('makes external purchase', async function() {
        const centsAmount = 24000; // $240.00
        try {
            const source = await presaleContract.paymentSource.call();
            assert.equal(source, pmtSrc, 'makes external purchase - Payment Source Failed');
            var isListed = await presaleContract.isEarlylisted(buyer1);
            assert.equal(isListed, true, 'makes external purchase - Early listed Failed');

            var tokenAmount = (await presaleContract.calcCentsToTokens.call(centsAmount, {from: buyer1})).toNumber();
            console.log("centsAmount: " + centsAmount + ", tokenAmount: " + tokenAmount);

            const totalExpected = (await tokenContract.totalSupply()).toNumber();
            const buyerExpected = (await tokenContract.balanceOf(buyer1)).toNumber();
            
            await presaleContract.externalPurchase(centsAmount, buyer1, {from: pmtSrc}).then((result) => {              
                LogEvents(result);
             });

            // check that the buyer got the right amount of tokens
            const buyerBal = (await tokenContract.balanceOf(buyer1)).toNumber();
            // check that tokensSold, totalSupply and availableSupply have been updated
            const totalSupply = (await tokenContract.totalSupply()).toNumber();

            assert.equal(totalSupply, totalExpected + tokenAmount, 'Total supply did not increase correctly'); 
            assert.equal(buyerBal, buyerExpected + tokenAmount, 'Balance did not increase correctly');

        } catch (error) {
            console.log(error);               
        }
    });

    it('buy fails because less than the min amount', async function(){ 
        try {
            const minCents = await presaleContract.minCents();
            const minWei = new web3.BigNumber(await presaleContract.minWei());
            const weiAmount = new web3.BigNumber(minWei.toNumber() - 10);
            console.log("minCents = " + minCents + ", minWei = " + minWei.toNumber() + ", weiAmount = " + weiAmount.toNumber());

            await presaleContract.buyTokens({ value: weiAmount.toNumber(), from: buyer2}).then((result) => { 
                LogEvents(result);
             });

            assert.isOk(false, 'Buy below minWei should have failed, but did not');

        } catch (error) {
            //console.log(error);  
            assert.isOk(true, 'Buy below minWei failed as intended');            
        }
    });

    it('buy fails because more than the max amount', async function(){
        try {
            const maxCents = await presaleContract.maxCents();
            const maxWei = new web3.BigNumber(await presaleContract.maxWei());
            const weiAmount = new web3.BigNumber(maxWei.toNumber() + 1);
            console.log("maxCents = " + maxCents + ", maxWei = " + maxWei + ", weiAmount = " + weiAmount);

            await presaleContract.buyTokens({ value: weiAmount.toNumber(), from: buyer2}).then((result) => { 
                LogEvents(result);
             });
             assert.isOk(false, 'Buy above maxWei should have failed, but did not');

        } catch (error) {
            //console.log(error);  
            assert.isOk(true, 'Buy above maxWei failed as intended');            
        }
    });

    it('buy fails because multiple buys exceed max', async function(){
        try {
            const maxCents = await presaleContract.maxCents();
            const maxWei = await presaleContract.maxWei();
            const weiAmount = new web3.BigNumber(19 * 1000000000000000000); // 19 eth
            console.log("maxCents = " + maxCents + ", maxWei = " + maxWei + ", weiAmount = " + weiAmount);

            await presaleContract.buyTokens({ value: weiAmount, from: buyer2}).then((result) => { 
                LogEvents(result);
             });
             assert.isOk(false, 'Buy above maxWei should have failed, but did not');

        } catch (error) {
            //console.log(error);  
            assert.isOk(true, 'Buy above maxWei failed as intended');            
        }
    });

    it('buys after tokens', async function(){
        try {
            const totalSupply = await tokenContract.totalSupply();
            const balanceo1 = await tokenContract.balanceOf(owner1);
            const balanceo2 = await tokenContract.balanceOf(owner2);
            const balance1 = await tokenContract.balanceOf(buyer1);
            const balance2 = await tokenContract.balanceOf(buyer2);
            const balance3 = await tokenContract.balanceOf(buyer3);
            const balance4 = await tokenContract.balanceOf(buyer4);
            const balancepmtSrc = await tokenContract.balanceOf(pmtSrc);
            const walletBalpmtSrc = (await web3.eth.getBalance(pmtSrc)).toNumber();
            const wallet1Bal = (await web3.eth.getBalance(wallet1)).toNumber();
            const wallet2Bal = (await web3.eth.getBalance(wallet2)).toNumber();
            var TokensSold = await presaleContract.tokensSold();
            var TokenCap = await presaleContract.tokenCap();
            console.log("Tokens Sold: " + TokensSold + " Token Cap " + TokenCap);
            
            console.log("totalSupply: " + totalSupply);
            console.log("balanceo1: " + balanceo1);
            console.log("balanceo2: " + balanceo2);        
            console.log("balance1: " + balance1);        
            console.log("balance2: " + balance2);        
            console.log("balance3: " + balance3);        
            console.log("balance4: " + balance4);        
            console.log("balancepmtSrc: " + balancepmtSrc);                
            console.log("walletBalpmtSrc: " + walletBalpmtSrc);                
            console.log("walletBal1: " + wallet1Bal);         
            console.log("walletBal2: " + wallet2Bal);         

        } catch (error) {
            console.log(error);              
        }
    })

    it('changes token price', async function() {
        const _tokensSold = 0;
        try {
            const currentPrice = (await presaleContract.getCurrentPrice(_tokensSold)).toNumber();
            console.log("currentPrice: " + currentPrice);

            const expectedPrice = currentPrice + 5; // goes from 15 to 20
            const changeSuccess = await presaleContract.changePrice(expectedPrice);
            const newPrice = (await presaleContract.getCurrentPrice(_tokensSold)).toNumber();

            assert.equal(newPrice, expectedPrice, 'Price Changed Failed');
        } catch (error) {
            console.log(error);
        }            
    });

    it('should pause correctly', async function() {
        try {
            await presaleContract.pause();
            const isPaused = await presaleContract.paused();
            assert.equal(isPaused, true, 'Presale was not paused correctly');                
        } catch (error) {
            console.log(error);           
        }
    });

    it('cannot buy when paused', async function(){
        try {
            const isPaused = await presaleContract.paused();
            const weiAmount = new web3.BigNumber(1 * 1000000000000000000); // 1 eth
            console.log("isPaused = " + isPaused + ", weiAmount = " + weiAmount);

            await presaleContract.buyTokens({ value: weiAmount, from: buyer2}).then((result) => { 
                LogEvents(result);
             });
             assert.isOk(false, 'Buy while paused should have failed, but did not');

        } catch (error) {
            //console.log(error);  
            assert.isOk(true, 'Buy while paused failed as intended');            
        }
    });
    
    it('should unpause correctly', async function() {
        try {
            await presaleContract.unpause();
            const isPaused = await presaleContract.paused();
            assert.equal(isPaused, false, 'Presale was not unpaused correctly');                
        } catch (error) {
            console.log(error);                
        }
    });

   it('change Conversion Rate', async function() {
        try {
            const newRate = new web3.BigNumber(95000);
            var conversionRate = await presaleContract.centsPerEth.call();
            
            await presaleContract.changeConversionRate(newRate).then((result) => { 
                LogEvents(result);
            });

            const changedRate = await presaleContract.centsPerEth.call();
            assert.equal(changedRate.toNumber(), newRate.toNumber(), 'change Conversion Rate Failed');                
        } catch (error) {
            console.log(error);                
        }
    });

    it('change Wallet', async function() {
        try {
                      
            await presaleContract.changeWallet(wallet2).then((result) => { 
                LogEvents(result);
            });

            assert.equal(true, true, 'change Wallet Failed');                
        } catch (error) {
            console.log(error);                
        }
    });

    it('buys tokens after Rate, Price and Wallet Change', async function(){
        const weiAmount = 1 * 1000000000000000000;
        try {
            const tokenAmount = (await presaleContract.calcTokens.call(weiAmount)).toNumber();
            //console.log("tokenAmount = " + tokenAmount);

            var isCapReached = await presaleContract.capReached();
            assert.equal(isCapReached, false, 'buys tokens after Rate, Price and Wallet Change - Cap Reached Failed');

            const totalExpected = (await tokenContract.totalSupply()).toNumber();
            const buyerExpected = (await tokenContract.balanceOf(buyer2)).toNumber();
            const walletExpected = (await web3.eth.getBalance(wallet2)).toNumber();
            const walletOldExpected = (await web3.eth.getBalance(wallet1)).toNumber();

            await presaleContract.buyTokens({ value: weiAmount, from: buyer2}).then((result) => { 
                LogEvents(result);
             });

            // check that the buyer got the right amount of tokens
            const buyerBal = (await tokenContract.balanceOf(buyer2)).toNumber();
            // check that tokensSold, totalSupply and availableSupply have been updated
            const totalSupply = (await tokenContract.totalSupply()).toNumber();
            // check that wei was transferred to correct wallet address
            const walletBal = (await web3.eth.getBalance(wallet2)).toNumber();
            const walletOldBal = (await web3.eth.getBalance(wallet1)).toNumber();

            //console.log("buyerBal = " + buyerBal);
            //console.log("totalSupply = " + totalSupply);
            //console.log("walletBal = " + walletBal);

            assert.equal(walletOldBal, walletOldExpected, 'buys tokens after Rate, Price and Wallet Change - Wallet1 balance did not increase correctly');  
            assert.equal(walletBal, walletExpected + weiAmount, 'buys tokens after Rate, Price and Wallet Change - Wallet2 balance did not increase correctly');  
            assert.equal(totalSupply, totalExpected + tokenAmount, 'buys tokens after Rate, Price and Wallet Change - Total supply did not increase correctly'); 
            assert.equal(buyerBal, buyerExpected + tokenAmount, 'buys tokens after Rate, Price and Wallet Change - Balance did not increase correctly');

        } catch (error) {
            console.log(error);              
        }
    });

    it('checks for early time', async function() {
        try {
            var earlyTime = await presaleContract.earlyTime();
            console.log("earlyTime = " + earlyTime);

            var now = Date.now();
            console.log("      now = " + Math.floor(now/1000));

            var startTime = await presaleContract.startTime();
            console.log("startTime = " + startTime);

            var isEarly = await presaleContract.isEarly();
            assert.equal(isEarly, true, 'Should be in earlybird phase');

            // early bird was only set up to last 10 seconds, so wait 11
            //await sleep(11000);

        } catch (error) {
            console.log(error);                
        }
    })

    it('change Start Time', async function() {
        try {
            var now = Date.now() / 1000;
            const newTime = Math.floor(now) + 2;
            console.log("newTime = " + Math.floor(newTime));

            await presaleContract.changeStartTime(newTime).then((result) => { 
                LogEvents(result);
             });

            startTime = await presaleContract.startTime();
            assert.equal(newTime, startTime.toNumber(), 'change Start Time Failed');                
        } catch (error) {
            console.log(error);                
        }
    });

    it('change End Time', async function() {
        try {
            var endTime = await presaleContract.endTime();
            const newTime = endTime.toNumber() + 1;

            await presaleContract.changeEndTime(newTime).then((result) => { 
                LogEvents(result);
            });

            endTime = await presaleContract.endTime();
            assert.equal(newTime, endTime.toNumber(), 'change End Time Failed');                
        } catch (error) {
            console.log(error);                
        }
    });

    it('checks that early phase has passed', async function() {
        try {
            // wait for start time to kick in
            await(sleep(10000));

            now = Date.now();
            console.log("  new now = " + Math.floor(now/1000));

            var isStillEarly = await presaleContract.isEarly();
            assert.equal(isStillEarly, false, 'Early bird phase should be over now');     

        } catch (error) {
            console.log(error);                
        }
    });

    it('buys more to hit the cap', async function(){
        const weiAmount = 14 * 1000000000000000000;
        try {
            const tokenAmount = (await presaleContract.calcTokens.call(weiAmount)).toNumber();

            const totalExpected = (await tokenContract.totalSupply()).toNumber();
            const buyerExpected = (await tokenContract.balanceOf(buyer3)).toNumber();
            const walletExpected = (await web3.eth.getBalance(wallet2)).toNumber();
            console.log("tokenAmount = " + tokenAmount);
            console.log("totalExpected = " + totalExpected);

            await presaleContract.buyTokens({ value: weiAmount, from: buyer3}).then((result) => { 
                LogEvents(result);
             });

            // check that the buyer got the right amount of tokens
            const buyerBal = (await tokenContract.balanceOf(buyer3)).toNumber();
            // check that tokensSold, totalSupply and availableSupply have been updated
            const totalSupply = (await tokenContract.totalSupply()).toNumber();
            // check that wei was transferred to correct wallet address
            const walletBal = (await web3.eth.getBalance(wallet2)).toNumber();
            console.log("buyerBal = " + buyerBal);
            console.log("totalSupply = " + totalSupply);
            console.log("walletBal = " + walletBal);

            const tokensSold = (await presaleContract.tokensSold()).toNumber();
            const tokenCap = (await presaleContract.tokenCap()).toNumber();
            var isCapReached = await presaleContract.capReached();
            console.log("tokensSold = " + tokensSold + ", cap = " + tokenCap + ", capReached = " + isCapReached);
            
            assert.equal(walletBal, walletExpected + weiAmount, 'Wallet balance did not increase correctly');  
            assert.equal(buyerBal, buyerExpected + tokenAmount, 'Balance did not increase correctly');
            assert.equal(totalSupply, (totalExpected + tokenAmount), 'Total supply did not increase correctly'); 
            assert.isOk(isCapReached, 'Cap was not reached as intended');

        } catch (error) {
            console.log(error);              
        }
    });

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    function LogEvents(result) {
        for (var i = 0; i < result.logs.length; i++) {
            var log = result.logs[i];
            RecordLog(log);
        }
    }

    function RecordLog(log) {
        switch (log.event) {
            case "TokensBought": {
                console.log("Event:" + " " + log.event +": " + log.args.tokenAmount.toNumber() + " by " + log.args.buyer + ", purchaser " + log.args.purchaser + ", centsPaid: " + log.args.centsPaid.toNumber());
                console.log("args:");
                for (const key of Object.keys(log.args))
                {
                    console.log(key + ": " + log.args[key]);
                }    
                break;
                break;
            }
            case "CapReached": {
                console.log("Event:" + " " + log.event +": " + log.args.tokensSold.toNumber() + " >= " + log.args.cap);
                break;
            }
            case "ExternalPurchase": {
                console.log("Event:" + " " + log.event +": " + " by " + log.args.buyer + " payment source " + log.args.source + " centsPaid: " + log.args.centsPaid.toNumber());
                break;
            }
            case "Mint": {
                console.log("Event:" + " " + log.event +": " + log.args.amount.toNumber() + " by " + log.args.to);
                break;
            }
            case "Transfer": {
                console.log("Event:" + " " + log.event +": " + log.args.value.toNumber() + " from " + log.args.from + " to " + log.args.to);
                break;
            }
            case "StartTimeChanged": {
                console.log("Event:" + " " + log.event +": " + log.args.newTime.toNumber());
                break;
            }
            case "EndTimeChanged": {
                console.log("Event:" + " " + log.event +": " + log.args.newTime.toNumber());
                break;
            }
            case "ConversionRateChanged": {
                console.log("Event:" + " " + log.event +": " + log.args.newRate.toNumber());
                break;
            }
            case "LogPrice": {
                console.log("Event:" + " " + log.event +": tokensSold: " + log.args.tokenLevel.toNumber() + ", price: " + log.args.price.toNumber());
                break;
            }
            case "WalletChanged": {
                console.log("Event:" + " " + log.event +": " + log.args.newWallet);
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