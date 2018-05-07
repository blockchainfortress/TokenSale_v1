var PeblikTokenSale = artifacts.require("PeblikTokenSale");
var PeblikToken = artifacts.require("PeblikToken");

contract('PeblikTokenSale', function(accounts) {

    const owner1 = accounts[0];
    const owner2 = accounts[1];
    const buyer1 = accounts[2];
    const buyer2 = accounts[3];
    const buyer3 = accounts[4];
    const buyer4 = accounts[5];
    const pmtSrc = accounts[6];
    const wallet1 = accounts[7];
    const wallet2 = accounts[8];

    const weiPerEth = new web3.BigNumber(1000000000000000000);

    let tokenSaleContract;
    let tokenContract;
    
    let tokenCap;

    before('setup contracts for all tests', async function () {
        // cache instances of the contracts for use in all the tests
        PeblikTokenSale.deployed().then(async function (instance) {
            tokenSaleContract = instance;

            tokenCap = (await tokenSaleContract.tokenCap()); // / weiPerEth;
            console.log("tokenCap = " + tokenCap)
        });

        PeblikToken.deployed().then(async function (tokenInstance) {
            tokenContract = tokenInstance;

            const addr = tokenContract.address;
            console.log("token contract address = " + addr);   
        });
    });

    it('change Start Time', async function() {
        try {
            var dt = new Date();
            dt.setDate(dt.getDate());
            const newTime = (Math.round((dt.getTime())/1000)) + 1; // now
            await tokenSaleContract.changeStartTime(newTime).then((result) => { 
                LogEvents(result);
            });

            startTime = await tokenSaleContract.startTime();
            assert.equal(newTime, startTime.toNumber(), 'change Start Time Failed');                
        } catch (error) {
            console.log(error);                
        }
    });

    it('change End Time', async function() {
        try {
            var dt = new Date();
            dt.setDate(dt.getDate());
            const newTime = (Math.round((dt.getTime())/1000)) + 5400; // 90 minutes after start
            await tokenSaleContract.changeEndTime(newTime).then((result) => { 
                LogEvents(result);
            });
            endTime = await tokenSaleContract.endTime();
            assert.equal(newTime, endTime.toNumber(), 'change End Time Failed');                
        } catch (error) {
            console.log(error);                
        }
    });

    it('changes payment source', async function() {
        try {
            await tokenSaleContract.changePaymentSource(pmtSrc, { from: owner1 }).then((result) => { 
                LogEvents(result);
             });
            const source = await tokenSaleContract.paymentSource.call();
            assert.equal(source, pmtSrc, 'Change Payment Source Failed');
        } catch (error) {
            console.log(error);
        }
    });

    it('changes token controller', async function () {
        try {
            //console.log("presale address: " + tokenSaleContract.address);
            await tokenContract.setController(tokenSaleContract.address, { from: owner1 });
            const controllerAddr = await tokenContract.controller.call();
            //console.log("controllerAddr: " + controllerAddr);
            assert.equal(tokenSaleContract.address, controllerAddr, 'setController Failed');
        } catch (error) {
            console.log(error);
        }
    });

    it('adds to whitelist', async function() {
        try {
            // add buyer1
            var isListed = await tokenSaleContract.isWhitelisted(buyer1);
        
            if (!isListed) {
                await tokenSaleContract.addToWhitelist(buyer1);
                isListed = await tokenSaleContract.isWhitelisted(buyer1);
            }
            assert.equal(isListed, true, 'Is White listed Failed');

            // add buyer3
            var isListed = await tokenSaleContract.isWhitelisted(buyer3);

            if (!isListed) {
                await tokenSaleContract.addToWhitelist(buyer3);
                isListed = await tokenSaleContract.isWhitelisted(buyer3);
            }
            assert.equal(isListed, true, 'Is White listed Failed');

            // add buyer4
            isListed = await tokenSaleContract.isWhitelisted(buyer4);
        
            if (!isListed) {
                await tokenSaleContract.addToWhitelist(buyer4);
                isListed = await tokenSaleContract.isWhitelisted(buyer4);
            }
            assert.equal(isListed, true, 'Is White listed Failed');
        } catch (error) {
            console.log(error);
            assert.isOk(false, "whitelisting failed");
        }
    });

    it('buys tokens', async function(){
        const ethAmount = 5;
        try {
           // check timing
           var presleep = Date.now();
           console.log(" presleep = " + Math.floor(presleep/1000));
           await sleep(2000);
           var startTime = await tokenSaleContract.startTime();
           console.log("startTime = " + startTime);
           var now = Date.now();
           console.log("      now = " + Math.floor(now/1000));
           var endTime = await tokenSaleContract.endTime();
           console.log("  endTime = " + endTime);

            var tokensSold = await tokenSaleContract.tokensSold();
            console.log("Tokens Sold: " + tokensSold + ", Cap: " + tokenCap);
            const dollarPrice = (await tokenSaleContract.getCurrentPrice.call(tokensSold));
            const centsPerEth = (await tokenSaleContract.centsPerEth());
            console.log("ethAmount: " + ethAmount + ", Price: " + dollarPrice + ", centsPerEth: " + centsPerEth);
            const weiAmount = new web3.BigNumber(ethAmount * weiPerEth);
            const tokenAmount = (await tokenSaleContract.calcTokens.call(weiAmount)).toNumber();
            
            const tokenConfirmation = new web3.BigNumber(weiAmount.toNumber() * (centsPerEth / dollarPrice));
            console.log("tokenAmount = " + tokenAmount + ", confirmation = " + tokenConfirmation);

            var isCapReached = await tokenSaleContract.capReached();
            assert.equal(isCapReached, false, 'buys tokens - Cap Reached Failed');

            const totalExpected = (await tokenContract.totalSupply()).toNumber();
            const buyerExpected = (await tokenContract.balanceOf(buyer1)).toNumber();
            const walletExpected = (await web3.eth.getBalance(wallet1)).toNumber();

            await tokenSaleContract.buyTokens({ value: weiAmount.toNumber(), from: buyer1}).then((result) => { 
                LogEvents(result);
             });

            // check that the buyer got the right amount of tokens
            const buyerBal = (await tokenContract.balanceOf(buyer1)).toNumber();
            // check that tokensSold, totalSupply and availableSupply have been updated
            const totalSupply = (await tokenContract.totalSupply()).toNumber();
            // check that wei was transferred to correct wallet address
            const walletBal = (await web3.eth.getBalance(wallet1)).toNumber();

            console.log("buyerBal = " + buyerBal);
            console.log("totalSupply = " + totalSupply);
            console.log("walletBal = " + walletBal);

            assert.equal(walletBal, walletExpected + weiAmount.toNumber(), 'Wallet balance did not increase correctly');  
            assert.equal(totalSupply, totalExpected + tokenAmount, 'Total supply did not increase correctly'); 
            assert.equal(buyerBal, buyerExpected + tokenAmount, 'Balance did not increase correctly');

        } catch (error) {
            console.log(error);   
            //assert.isOk(false);
        }
    });

    it('buys more tokens', async function(){
        const ethAmount = 8;
        try {
            var tokensSold = await tokenSaleContract.tokensSold();
            console.log("Tokens Sold: " + tokensSold + ", Cap: " + tokenCap);
            const dollarPrice = (await tokenSaleContract.getCurrentPrice.call(tokensSold));
            const centsPerEth = (await tokenSaleContract.centsPerEth());
            console.log("ethAmount: " + ethAmount + ", Price: " + dollarPrice + ", centsPerEth: " + centsPerEth);
            const weiAmount = new web3.BigNumber(ethAmount * weiPerEth);
            const tokenAmount = (await tokenSaleContract.calcTokens.call(weiAmount)).toNumber();
            
            const tokenConfirmation = new web3.BigNumber(weiAmount.toNumber() * (centsPerEth / dollarPrice));
            console.log("tokenAmount = " + tokenAmount + ", confirmation = " + tokenConfirmation);

            var isCapReached = await tokenSaleContract.capReached();
            assert.equal(isCapReached, false, 'buys tokens - Cap Reached Failed');

            const totalExpected = (await tokenContract.totalSupply()).toNumber();
            const buyerExpected = (await tokenContract.balanceOf(buyer3)).toNumber();
            const walletExpected = (await web3.eth.getBalance(wallet1)).toNumber();

            await tokenSaleContract.buyTokens({ value: weiAmount.toNumber(), from: buyer3}).then((result) => { 
                LogEvents(result);
             });

            // check that the buyer got the right amount of tokens
            const buyerBal = (await tokenContract.balanceOf(buyer3)).toNumber();
            // check that tokensSold, totalSupply and availableSupply have been updated
            const totalSupply = (await tokenContract.totalSupply()).toNumber();
            // check that wei was transferred to correct wallet address
            const walletBal = (await web3.eth.getBalance(wallet1)).toNumber();

            console.log("buyerBal = " + buyerBal);
            console.log("totalSupply = " + totalSupply);
            console.log("walletBal = " + walletBal);

            assert.equal(walletBal, walletExpected + weiAmount.toNumber(), 'Wallet balance did not increase correctly');  
            assert.equal(totalSupply, totalExpected + tokenAmount, 'Total supply did not increase correctly'); 
            assert.equal(buyerBal, buyerExpected + tokenAmount, 'Balance did not increase correctly');

        } catch (error) {
            console.log(error);   
            //assert.isOk(false);
        }
    });

    it('buys tokens at phase 2 price', async function(){
        const ethAmount = 2;
        try {
            const tokensSold = await tokenSaleContract.tokensSold();
            console.log("Tokens Sold: " + tokensSold.toNumber() + ", Cap: " + tokenCap);
            const dollarPrice = (await tokenSaleContract.getCurrentPrice.call(tokensSold.toNumber()));
            const centsPerEth = (await tokenSaleContract.centsPerEth());
            console.log("ethAmount: " + ethAmount + ", Price: " + dollarPrice + ", centsPerEth: " + centsPerEth);
            const weiAmount = new web3.BigNumber(ethAmount * weiPerEth);
            const tokenAmount = await tokenSaleContract.calcTokens.call(weiAmount);
            console.log("tokenAmount: " + tokenAmount.toNumber());
            var amt = parseInt(web3.fromWei(tokensSold, "ether")) + parseInt(web3.fromWei(tokenAmount, "ether"));
            console.log("tokensSold + tokenAmount: " + amt);
            //const tokenConfirmation = new web3.BigNumber(weiAmount.toNumber() * (centsPerEth / dollarPrice));
            //console.log("tokenAmount = " + tokenAmount + ", confirmation = " + tokenConfirmation);

            await tokenSaleContract.buyTokens({ value: weiAmount.toNumber(), from: buyer4}).then((result) => { 
                LogEvents(result);
             });
            var newTokens = await tokenSaleContract.tokensSold();
            var newTokensSold = parseInt(web3.fromWei(newTokens, "ether"));
            var expectedTokensSold = parseInt(web3.fromWei(tokensSold, "ether")) + parseInt(web3.fromWei(tokenAmount, "ether"));
            //var expectedTokensSold = new web3.BigNumber(tokenAmount / weiPerEth).toNumber() + tokensSold;
            var newPrice = await tokenSaleContract.getCurrentPrice.call(newTokens.toNumber());

            console.log("newTokensSold = " + newTokensSold);
            console.log("newPrice = " + newPrice);
            var additionTokens = tokenAmount / weiPerEth;
            var expectedTokens = parseInt(tokensSold) + parseInt(additionTokens);
            //console.log("additionTokens = " + additionTokens);
            //console.log("expectedTokens = " + expectedTokens);
         
            assert.isAbove(newPrice, dollarPrice, 'Price should have increased'); 
            assert.equal(newTokensSold, expectedTokensSold, 'Tokens sold did not update correctly');  

        } catch (error) {
            console.log(error);   
            assert.isOk(false);
        }
    });

    it('buy fails because less than the min amount', async function(){ 
        try {
            const minCents = await tokenSaleContract.minCents();
            const minWei = await tokenSaleContract.minWei();
            const weiAmount = Math.floor(minWei.toNumber() / 2);
            console.log("minCents = " + minCents + ", minWei = " + minWei + ", weiAmount = " + weiAmount);

            await tokenSaleContract.buyTokens({ value: weiAmount, from: buyer3}).then((result) => { 
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
            const maxCents = await tokenSaleContract.maxCents();
            const maxWei = await tokenSaleContract.maxWei();
            const weiAmount = maxWei.toNumber() + 10;
            console.log("maxCents = " + maxCents + ", maxWei = " + maxWei + ", weiAmount = " + weiAmount);

            await tokenSaleContract.buyTokens({ value: weiAmount, from: buyer3}).then((result) => { 
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
            const maxCents = await tokenSaleContract.maxCents();
            const maxWei = await tokenSaleContract.maxWei();
            const weiAmount = new web3.BigNumber(19 * 1000000000000000000); // 19 eth
            console.log("maxCents = " + maxCents + ", maxWei = " + maxWei + ", weiAmount = " + weiAmount);

            await tokenSaleContract.buyTokens({ value: weiAmount, from: buyer4}).then((result) => { 
                LogEvents(result);
             });
             assert.isOk(false, 'Buy above maxWei should have failed, but did not');

        } catch (error) {
            //console.log(error);  
            assert.isOk(true, 'Buy above maxWei failed as intended');            
        }
    });

    it('makes external purchase', async function() {
        var isPurchased = false;
        const centsAmount = 10500;
        try {
            const source = await tokenSaleContract.paymentSource.call();
            assert.equal(source, pmtSrc, 'Payment Source Failed');
            var isListed = await tokenSaleContract.isWhitelisted(buyer4);
            assert.equal(isListed, true, 'Early listed Failed');
  
            var tokenAmount = (await tokenSaleContract.calcCentsToTokens.call(centsAmount, {from: buyer4})).toNumber();
            const totalExpected = (await tokenContract.totalSupply()).toNumber();
            const buyerExpected = (await tokenContract.balanceOf(buyer4)).toNumber();

            console.log("tokenAmount= " + tokenAmount);
            console.log("totalExpected= " + totalExpected);

            await tokenSaleContract.externalPurchase(centsAmount, buyer4, {from: pmtSrc}).then((result) => {              
                LogEvents(result);
            });

            // check that the buyer got the right amount of tokens
            const buyerBal = (await tokenContract.balanceOf(buyer4));
            // check that tokensSold, totalSupply and availableSupply have been updated
            const totalSupply = (await tokenContract.totalSupply());

            assert.equal(buyerBal, buyerExpected + tokenAmount, 'Balance did not increase correctly');
            assert.equal(totalSupply, totalExpected + tokenAmount, 'Total supply did not increase correctly'); 

            assert.equal(totalSupply.toNumber(), totalExpected + tokenAmount, 'Total supply did not increase correctly'); 
            assert.equal(buyerBal.toNumber(), buyerExpected + tokenAmount, 'Balance did not increase correctly');

        } catch (error) {
            console.log(error);
        }
    });

    it('should pause correctly', async function() {
        try {
            await tokenSaleContract.pause();
            const isPaused = await tokenSaleContract.paused();
            assert.equal(isPaused, true, 'Presale was not paused correctly');                
        } catch (error) {
            console.log(error);           
        }
    });
    
    it('should unpause correctly', async function() {
        try {
            await tokenSaleContract.unpause();
            const isPaused = await tokenSaleContract.paused();
            assert.equal(isPaused, false, 'Presale was not unpaused correctly');                
        } catch (error) {
            console.log(error);                
        }
    });

    it('changes price levels', async function() {

        const _value = 0;
        const _centsRaised = 0;
        const _tokensSold = (110000 * 1000000000000000000);
        const thresholds = [0,55000,105000,155000];
        const prices = [30,40,55,60];
        const expectedPrice = 55;
  
        try {
            const valid = await tokenSaleContract.changePriceLevels(thresholds,prices).then((result) => { 
                LogEvents(result);
            });
            const newPrice = await tokenSaleContract.getCurrentPrice(_tokensSold);
            assert.equal(newPrice.toNumber(), expectedPrice, 'change Levels price Failed');
        } catch (error) {
            console.log(error);
        }            
    });

   it('change Conversion Rate', async function() {
        try {
            const newRate = new web3.BigNumber(81000);
            var conversionRate = await tokenSaleContract.centsPerEth();
            
            await tokenSaleContract.changeConversionRate(newRate).then((result) => { 
                LogEvents(result);
            });
            conversionRate = await tokenSaleContract.centsPerEth();
            assert.equal(newRate.toNumber(), conversionRate.toNumber(), 'change Conversion Rate Failed');                
        } catch (error) {
            console.log(error);   
            assert.isOk(false, "price levels not changed");            
        }
    });

    it('change Wallet', async function() {
        try {
                      
            await tokenSaleContract.changeWallet(wallet2).then((result) => { 
                LogEvents(result);
            });

            assert.equal(true, true, 'change Wallet Failed');                
        } catch (error) {
            console.log(error);                
        }
    });

    it('buys tokens after Rate and Wallet changes', async function(){
        const weiAmount = new web3.BigNumber(1 * weiPerEth);
        const tokensExpected = new web3.BigNumber(2700 * weiPerEth);  // based on 30 cent price
        try {
            const tokenAmount = (await tokenSaleContract.calcTokens.call(weiAmount.toNumber())).toNumber();
            console.log("tokenAmount = " + tokenAmount);

            var isCapReached = await tokenSaleContract.capReached.call();
            assert.equal(isCapReached, false, 'buys tokens after Rate Change and Wallet - Cap Reached Failed');

            const totalExpected = (await tokenContract.totalSupply()).toNumber();
            const buyerExpected = (await tokenContract.balanceOf(buyer4)).toNumber();
            const walletExpected = (await web3.eth.getBalance(wallet2)).toNumber();
            const walletOldExpected = (await web3.eth.getBalance(wallet1)).toNumber();

            await tokenSaleContract.buyTokens({ value: weiAmount.toNumber(), from: buyer4}).then((result) => { 
                LogEvents(result);
            });

            // check that the buyer got the right amount oSf tokens
            const buyerBal = (await tokenContract.balanceOf(buyer4)).toNumber();
            // check that tokensSold, totalSupply and availableSupply have been updated
            const totalSupply = (await tokenContract.totalSupply()).toNumber();
            // check that wei was transferred to correct wallet address
            const walletBal = (await web3.eth.getBalance(wallet2)).toNumber();
            const walletOldBal = (await web3.eth.getBalance(wallet1)).toNumber();

            console.log("buyerBal = " + buyerBal);
            console.log("totalSupply = " + totalSupply);
            console.log("walletBal = " + walletBal + ", walletOldBal = " + walletOldBal);

            assert.equal(tokenAmount, tokensExpected.toNumber(), 'tokenAmount is wrong');
            assert.equal(walletOldBal, walletOldExpected, 'Wallet1 balance did not increase correctly');  
            assert.equal(walletBal, walletExpected + weiAmount.toNumber(), 'Wallet2 balance did not increase correctly');  
            assert.equal(totalSupply, totalExpected + tokenAmount, 'Total supply did not increase correctly'); 
            assert.equal(buyerBal, buyerExpected + tokenAmount, 'Balance did not increase correctly');


        } catch (error) {
            console.log(error);              
        }
    });

   it('change Employee Pool Wallet', async function() {
        try {
            await tokenSaleContract.changeEmployeePoolWallet(owner1).then((result) => { 
                LogEvents(result);
            });
            var newOwner = await tokenSaleContract.employeePoolWallet();
            assert.equal(newOwner, owner1, 'change Employee Pool Wallet Failed');                
        } catch (error) {
            console.log(error);                
        }
    });

    it('change Advisor Pool Wallet', async function() {
        try {
            await tokenSaleContract.changeAdvisorPoolWallet(owner2).then((result) => { 
                LogEvents(result);
            });
            var newOwner = await tokenSaleContract.advisorPoolWallet();
            assert.equal(newOwner, owner2, 'change Advisor Pool Wallet Failed');                
        } catch (error) {
            console.log(error);                
        }
    });

    it('change Bounty Program Wallet', async function() {
        try {
            await tokenSaleContract.changeBountyProgramWallet(wallet1).then((result) => { 
                LogEvents(result);
            });
            var newOwner = await tokenSaleContract.bountyProgramWallet();
            assert.equal(newOwner, wallet1, 'change Bounty Program Wallet Failed');                
        } catch (error) {
            console.log(error);                
        }
    });

    it('claim Stranded Tokens', async function(){
        const weiAmount = new web3.BigNumber(1 * weiPerEth);
        const tokensExpected = new web3.BigNumber(2700 * weiPerEth);  // based on 30 cent price
        try {

            const balance = (await tokenContract.balanceOf(buyer4)).toNumber();
            const tokenAmount = 300 * 1000000000000000000;
            const balanceExpected = balance + tokenAmount;
            console.log("balanceExpected: " + balanceExpected);
            await tokenContract.mint(tokenSaleContract.address, tokenAmount).then((result) => {
                LogEvents(result);
            }); 

            const saleBalance = await tokenContract.balanceOf(tokenSaleContract.address);
            console.log("saleBalance: " + saleBalance);

            await tokenContract.setTransferable();
            const isTransferable = await tokenContract.transferable.call();
            assert.equal(isTransferable, true, 'Token should now be transferable');

            await tokenSaleContract.claimStrandedTokens(tokenContract.address, buyer4, tokenAmount, { from: owner1}).then((result) => { 
                LogEvents(result);
            });
            const contractBalance = (await tokenContract.balanceOf(tokenSaleContract.address)).toNumber();
            const newBalance = (await tokenContract.balanceOf(buyer4)).toNumber();
            assert.equal(contractBalance, 0, 'Contract token balance was not correct');
            assert.equal(newBalance, balanceExpected, 'Beneficiary balance did not increase correctly');

        } catch (error) {
            console.log(error);              
        }
    });

    it('Sale Complete', async function() {
        try {
            
            var dt = new Date();
            dt.setDate(dt.getDate());
            const newTime = (Math.round((dt.getTime())/1000)) + 2; // now
            await tokenSaleContract.changeEndTime(newTime).then((result) => { 
                LogEvents(result);
            });

            await sleep(10000);

            const baseAmount = 1 * weiPerEth;

            const employeePoolToken = 360000000 * baseAmount;
            const advisorPoolToken = 120000000 * baseAmount;
            const bountyProgramToken = 120000000 * baseAmount;

            const totalExpected = (await tokenContract.totalSupply()).toNumber();
            const owner1BalExpected = (await tokenContract.balanceOf(owner1)).toNumber();
            const owner2BalExpected = (await tokenContract.balanceOf(owner2)).toNumber();
            const wallet1BalExpected = (await tokenContract.balanceOf(wallet1)).toNumber();

            //console.log("totalExpected " + totalExpected);
            //console.log("owner1BalExpected " + owner1BalExpected);
            //console.log("owner2BalExpected " + owner2BalExpected);
            //console.log("wallet1BalExpected " + wallet1BalExpected);

            await tokenSaleContract.completeSale().then((result) => { 
                LogEvents(result);
             });
            
            // check that tokensSold, totalSupply and availableSupply have been updated
            const totalSupply = (await tokenContract.totalSupply()).toNumber();
            // check that the Accounts got the right amount of tokens
            const owner1Bal = (await tokenContract.balanceOf(owner1)).toNumber();
            const owner2Bal = (await tokenContract.balanceOf(owner2)).toNumber();
            const wallet1Bal = (await tokenContract.balanceOf(wallet1)).toNumber();

            //console.log("totalSupply " + totalSupply);
            //console.log("owner1Bal " + owner1Bal);
            //console.log("owner2Bal " + owner2Bal);
            //console.log("wallet1Bal " + wallet1Bal);

            var amt = parseInt(web3.fromWei(totalExpected, "ether")) + parseInt(web3.fromWei(employeePoolToken, "ether")) + parseInt(web3.fromWei(advisorPoolToken, "ether")) + parseInt(web3.fromWei(bountyProgramToken, "ether"));

            //console.log("totalExpected + employeePoolToken + advisorPoolToken + bountyProgramToken " + (totalExpected + employeePoolToken + advisorPoolToken + bountyProgramToken));
            assert.equal(parseInt(web3.fromWei(totalSupply, "ether")), amt, 'Sale Complete - Total supply did not increase correctly'); 
            assert.equal(owner1Bal, owner1BalExpected + employeePoolToken, 'Sale Complete - Balance did not increase correctly');
            assert.equal(owner2Bal, owner2BalExpected + advisorPoolToken, 'Sale Complete - Balance did not increase correctly');
            assert.equal(wallet1Bal, wallet1BalExpected + bountyProgramToken, 'Sale Complete - Balance did not increase correctly');            
        } catch (error) {
            console.log(error);                
        }
    })

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
                console.log("Event:" + " " + log.event +": " + log.args.tokenAmount.toNumber() + " by " + log.args.buyer + " purchaser " + log.args.purchaser + " centsPaid: " + log.args.centsPaid.toNumber());
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
            case "PriceLevelsChanged": {
                console.log("Event:" + " " + log.event +": " + log.args.numLevelsAdded.toNumber());
                break;
            }
            case "LogPrice": {
                console.log("Event:" + " " + log.event +": tokensSold: " + log.args.tokenLevel.toNumber() + ", price: " + log.args.price.toNumber());
                break;
            }
            case "EmployeeWalletChanged":
            case "AdvisorWalletChanged":
            case "BountyWalletChanged":
            case "WalletChanged": {
                console.log("Event:" + " " + log.event +": " + log.args.newWallet);
                break;
            }       
            case "PaymentSourceChanged": {
                console.log("Event:" + " " + log.event +": oldSource " + log.args.oldSource + " newSource " + log.args.newSource);
                break;
            }        
            case "PriceLevelsChanged": {
                console.log("Event:" + " " + log.event +": numLevelsAdded " + log.args.numLevelsAdded);
                break;
            }        
            case "SaleComplete": {
                console.log("Event:" + " " + log.event +": totalSupply " + log.args.totalSupply.toNumber());
                break;
            }default: {
                //console.log(log.event);
                console.log(log);
                break;
            }
        }
    }

});