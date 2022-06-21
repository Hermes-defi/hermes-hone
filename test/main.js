var chai = require("chai");
var expect = chai.expect;
var assert = chai.assert;

const { ethers } = require("hardhat");
const { utils } = require('ethers');
const { expectRevert } = require('@openzeppelin/test-helpers');
const { BigNumber } = ethers


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

const duration = {
    seconds: function (val) {
        return val
    },
    minutes: function (val) {
        return val * this.seconds(60)
    },
    hours: function (val) {
        return val * this.minutes(60)
    },
    days: function (val) {
        return val * this.hours(24)
    },
    weeks: function (val) {
        return val * this.days(7)
    },
    years: function (val) {
        return val * this.days(367);
    },
}
async function advanceBlock() {
    return ethers.provider.send("evm_mine", [])
}
async function advanceBlockTo(blockNumber) {
    for (let i = await ethers.provider.getBlockNumber(); i < blockNumber; i++) {
        await advanceBlock()
    }
}

describe("main", function () {
    beforeEach(async function () {
        [dev, user, none, alice, bob, charlie] = await ethers.getSigners();
        devAddress = dev.address,
            userAddress = user.address,
            noneAddress = none.address,
            aliceAddress = alice.address,
            bobAddress = bob.address;
        const _main = await ethers.getContractFactory("MainMulti");
        main = await _main.deploy(true, dev.address);
        await main.deployed();
        postDeployDevBalance = await main.provider.getBalance(dev.address);
        await main.add(userAddress);
        await main.add(noneAddress);
        await main.set(userAddress,true);
        await main.set(noneAddress,true);
    });












    describe("When multiple users deposit", () => {

        let contractBalance;
        let aliceInitialBalance;

        it("At least two users deposit.", async () => {
            // contract balance should be zero
            contractBalance = parseInt(fromWei(await main.provider.getBalance(main.address)));
            assert.equal(contractBalance, '0');

            // alice can deposit 5 ONE and receive 5 sONE.
            aliceInitialBalance = ethers.BigNumber.from(await main.provider.getBalance(alice.address));

            await main.connect(alice).deposit({ value: ONE_H });
            assert.equal(await main.balanceOf(alice.address), ONE_H);

            let validator = (await main.validatorLowestBalance());
            console.log('validatorLowestBalance', validator );
            // console.log('validatorsByAddress', (await main.validatorsByAddress(validator)) );

            contractBalance = await main.provider.getBalance(main.address);
            assert.equal(contractBalance, ONE_H);

            await main.connect(bob).deposit({ value: ONE_H });
            assert.equal(await main.balanceOf(bob.address), ONE_H);
            console.log('validatorLowestBalance', (await main.validatorLowestBalance()) );

            contractBalance = await main.provider.getBalance(main.address);
            assert.equal(contractBalance, TWO_H);

            await main.connect(alice).unstake(ONE_H);
            await main.connect(bob).unstake(ONE_H);

            await ethers.provider.send("evm_increaseTime", [ duration.weeks(2) ]);
            await advanceBlockTo(300);

            const canWithdraw1 = await main.canWithdraw(bob.address, ONE_H);
            const canWithdraw2 = await main.canWithdraw(alice.address, ONE_H);
            console.log('canWithdraw bob', canWithdraw1);
            console.log('canWithdraw alice', canWithdraw2);

            await main.connect(bob).withdraw(ONE_H);
            await main.connect(alice).withdraw(ONE_H);
        });

    });

});


