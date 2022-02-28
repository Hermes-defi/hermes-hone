var chai = require("chai");
var expect = chai.expect;
var assert = chai.assert;

const { ethers } = require("hardhat");
const { utils } = require('ethers');
const { expectRevert } = require('@openzeppelin/test-helpers');


let dev, user, none, alice, bob, charlie, devAddress, userAddress, noneAddress, aliceAddress, bobAddress;
let main;
let postDeployDevBalance;

const ONE = toWei('1'), TWO = toWei('2'), THREE = toWei('3'), FIVE = toWei('5'), TEN = toWei('10');
const ONE_H = toWei('100'), TWO_H = toWei('200'), THREE_H = toWei('300'), NINETY = toWei('90');

function toWei(v) {
    return utils.parseUnits(v, 18).toString();
}

function fromWei(v) {
    return utils.formatUnits(v, 18).toString();
}


describe("main", function () {
    beforeEach(async function () {
        [dev, user, none, alice, bob, charlie] = await ethers.getSigners();
        devAddress = dev.address,
            userAddress = user.address,
            noneAddress = none.address,
            aliceAddress = alice.address,
            bobAddress = bob.address;
        const _main = await ethers.getContractFactory("Main");
        main = await _main.deploy(dev.address, dev.address);
        await main.deployed();
        postDeployDevBalance = await main.provider.getBalance(dev.address);
    });


    describe("Check for proper deposit", () => {
        it("Should only allow deposit greater than minDelegate", async () => {
            // Will revert if deposit is less thatn minimum required.
            await expectRevert(main.connect(alice).deposit({ value: FIVE }), 'Can only delegate a minimum of 100 ONE');
        });
    });

    describe("Check for epoch", () => {
        it("Should spit out epoch", async () => {
            const epoch = await main.epoch();
            console.log("epoch:", epoch);
        });
    });

    describe("Check for propper event emission.", () => {

        it("Should emit an event when fees are changed", async () => {

            await expect(main.changeFee("100")).to.emit(main, "feeChanged").withArgs(0, 100);
        });

        it("Should emit an event when minimum delegation amount is changed", async () => {
            const oldAmount = await main.minDelegate();
            const newAmout = toWei('101');
            await expect(main.changeMinDelegate(toWei('101'))).to.emit(main, "minDelegateChanged").withArgs(oldAmount, newAmout);
        });

        it("Should emit an event when fee address is changed", async () => {
            const oldFeeAddress = await main.feeAddress();
            await expect(main.changeFeeAddress(alice.address)).to.emit(main, "feeAddressChanged").withArgs(oldFeeAddress, alice.address);
        });

        it("Should emit an event when validator address is changed", async () => {
            const validatorAddress = await main.validatorAddress();
            await expect(main.changeValidator(alice.address)).to.emit(main, "validatorChanged").withArgs(validatorAddress, alice.address);
        });
        //TODO: add event test for withdrawEpochsChanged
        //TODO: add event test for withdrawTimestampChanged
        //TODO: add event test for CollectReward
        //TODO: add event test for Withdraw
        //TODO: add event test for Unstake
        //TODO: add event test for deposit

    });

    describe("When all user unstake all deposits", () => {

        beforeEach("deposit and withdraw ONE", async () => {
            // Validate that initial supply is ZERO
            let supply = await main.totalSupply();
            assert.equal(supply, 0);

            // user deposit
            await main.connect(alice).deposit({ value: ONE_H });

            // Validate that supply has increased to deposit amout
            supply = await main.totalSupply();
            assert.equal(supply, ONE_H);

            // User withdraws
            await expect(main.connect(alice).unstake(ONE_H)).to.emit(main, "Unstake");

        });

        xit("Contract balance should be zero", async function () {
            // Check contract balance 
            let balance = parseInt(fromWei(await main.provider.getBalance(main.address)));
            expect(balance).to.be.eq(0);
        });

        it("sOne supply should be zero", async function () {
            let supply = await main.totalSupply();
            assert.equal(supply, 0);
        });

        it("Alice should have funds in the waiting room", async function () {
            let unstakedAmount = await main._staked(alice.address);
            expect(unstakedAmount).to.be.gt(0)

        });

    });

    xdescribe("When ether is sent to contract", () => {
        it("should revert as this contract should not be able to receive ether", async function () {
            // send ether to contract
            await expectRevert.unspecified(user.sendTransaction({ to: main.address, value: ethers.utils.parseEther("100") }));

        });
    });

    describe("When multiple users deposit", () => {

        let contractBalance;
        let aliceInitialBalance;
        let bobInitialBalance
        let aliceDepositGasCost;
        let bobDepositGasCost;

        beforeEach("At least two users deposit.", async () => {
            // contract balance should be zero
            contractBalance = parseInt(fromWei(await main.provider.getBalance(main.address)));
            assert.equal(contractBalance, '0');

            // alice can deposit 5 ONE and receive 5 sONE.
            aliceInitialBalance = ethers.BigNumber.from(await main.provider.getBalance(alice.address));
            const { hash: depositHash, gasPrice: depositGasPrice } = await main.connect(alice).deposit({ value: ONE_H });

            // calc gas cost of transaction
            const aliceDepositReceipt = await main.provider.getTransactionReceipt(depositHash);
            aliceDepositGasCost = depositGasPrice.mul(aliceDepositReceipt.gasUsed);

            // check balances are as expected
            contractBalance = await main.provider.getBalance(main.address);
            assert.equal(contractBalance, ONE_H);

            aliceSoneBalance = await main.balanceOf(alice.address);
            assert.equal(aliceSoneBalance, ONE_H);

            // bob can deposit 5 ONE and receive 5 sONE.
            bobInitialBalance = ethers.BigNumber.from(await main.provider.getBalance(bob.address));
            const { hash: bobDepositHash, gasPrice: bobDepositTxGasPrice } = await main.connect(bob).deposit({ value: ONE_H });

            // calculate TX cost
            const bobDepositReceipt = await main.provider.getTransactionReceipt(bobDepositHash);
            bobDepositGasCost = bobDepositTxGasPrice.mul(bobDepositReceipt.gasUsed);

            // check contract balance
            contractBalance = await main.provider.getBalance(main.address);
            assert.equal(contractBalance, TWO_H);

            // check bob Sone balance
            bobSoneBalance = (await main.balanceOf(bob.address)).toString();
            assert.equal(bobSoneBalance, ONE_H);

        });

        it("sOne value should be greater than ONE once reward started.", async function () {
            // simulate rewards
            await none.sendTransaction({ to: main.address, value: ethers.utils.parseEther("100") });

            // charlie user deposit
            await main.connect(charlie).deposit({ value: ONE_H });
            charlieSoneBalance = await main.balanceOf(charlie.address);
            expect(charlieSoneBalance).to.be.lte(ONE_H);

        });

        it("Withdrawing should return the deposited amount to users", async function () {
            // get users sOne balance
            const alice_sone_balance = (await main.balanceOf(alice.address)).toString();
            const bob_sone_balance = (await main.balanceOf(bob.address)).toString();

            //when alice withdraw she should receive deposited amount less gas.
            const { hash: withdrawHash, gasPrice: withdrawGasPrice } = await main.connect(alice).unstake(alice_sone_balance);

            // calculate TX cost
            const aliceWithdrawReceipt = await main.provider.getTransactionReceipt(withdrawHash);
            const aliceWithdrawGasCost = withdrawGasPrice.mul(aliceWithdrawReceipt.gasUsed);

            // verify expected balances
            const aliceBalance = (await main.provider.getBalance(alice.address)).toString();
            const aliceBalanceLessGass = aliceInitialBalance.sub(aliceDepositGasCost).sub(aliceWithdrawGasCost);

            // check alice balance after withdraw
            // assert.equal(aliceBalance, aliceBalanceLessGass); //
            alicePendingFunds = await main._staked(alice.address);
            expect(alicePendingFunds).to.be.equal(ONE_H);

            // when bob withdraws
            const { hash: bobWithdrawHash, gasPrice: bobWithdrawGasPrice } = await main.connect(bob).unstake(bob_sone_balance);

            // calc TX cost
            const bobWithdrawReceipt = await main.provider.getTransactionReceipt(bobWithdrawHash);
            const bobWithdrawGasCost = bobWithdrawGasPrice.mul(bobWithdrawReceipt.gasUsed);

            // check for expected balances
            const bobBalance = (await main.provider.getBalance(bob.address)).toString();
            const bobBalanceLessGass = bobInitialBalance.sub(bobDepositGasCost).sub(bobWithdrawGasCost);

            // check balances
            // assert.equal(bobBalance, bobBalanceLessGass);
            bobPendingFunds = await main._staked(bob.address);
            expect(bobPendingFunds).to.be.equal(ONE_H);
        });

        xit("After all users withdraw, contract balance should be zero", async function () {
            // get users sOne balance
            const alice_sone_balance = (await main.balanceOf(alice.address)).toString();
            const bob_sone_balance = (await main.balanceOf(bob.address)).toString();

            // when alice withdraw she should receive deposited amount less gas.
            await main.connect(alice).withdraw(alice_sone_balance);

            // verify expected balances
            contractBalance = await main.provider.getBalance(main.address);
            assert.equal(contractBalance, ONE_H);

            // when bob withdraws
            await main.connect(bob).withdraw(bob_sone_balance);

            // check for expected balances
            contractBalance = await main.provider.getBalance(main.address);

            // check balances
            assert.equal(contractBalance, '0');

        });

    });

    xdescribe("When fees are changed", () => {
        let postFeeChangeDevBalance;

        before("change fees to 1%", async () => {
            // change fees
            await main.changeFee("100");

            postFeeChangeDevBalance = await main.provider.getBalance(dev.address);
            // user deposit
            await main.connect(alice).deposit({ value: ONE_H });

            const aliceSoneBalance = await main.balanceOf(alice.address);
            // User withdraws
            await main.connect(alice).withdraw(aliceSoneBalance);
        });

        it("should only allow fees be less than 10%", async () => {
            // check that reverts when amout is too big
            await expectRevert(main.changeFee("10000"), 'invalid fee');
        });

        it("FeeAddress balance should increase.", async function () {
            // check fee address balance.
            const currentFeeAddressBalance = await main.provider.getBalance(dev.address);
            expect(currentFeeAddressBalance).to.be.gt(postFeeChangeDevBalance);
        });
    });

});
