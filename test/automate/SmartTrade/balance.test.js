const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('SmartTrade.balance', function () {
  let balance, automate;
  let owner, notOwner;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    const Balance = await ethers.getContractFactory('ApprovableBalance');
    balance = await Balance.deploy(zeroAddress, zeroAddress);
    await balance.deployed();

    const Automate = await ethers.getContractFactory('SmartTrade');
    automate = await Automate.deploy(balance.address);
    await automate.deployed();

    [owner, notOwner] = await ethers.getSigners();
  });

  it('changeBalance: should change balance contract address', async function () {
    const newBalance = '0x0000000000000000000000000000000000000001';
    strictEqual(await automate.balance(), balance.address, 'Invalid start balance');

    await automate.changeBalance(newBalance);

    strictEqual(await automate.balance(), newBalance, 'Invalid end balance');
  });

  it('changeBalance: should revert tx if not owner', async function () {
    await assertions.reverts(automate.connect(notOwner).changeBalance(zeroAddress), 'Ownable: caller is not the owner');
  });
});
