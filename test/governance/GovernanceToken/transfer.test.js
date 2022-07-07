const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('GovernanceToken.transfer', function () {
  let gov, account1, account2;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    [account1, account2] = await ethers.getSigners();

    const Gov = await ethers.getContractFactory('GovernanceToken');
    gov = await Gov.deploy(account1.address);
    await gov.deployed();
  });

  it('transfer: should transfer tokens to address', async function () {
    const amount = '100';

    const startAccount1Balance = await gov.balanceOf(account1.address);
    const startAccount2Balance = await gov.balanceOf(account2.address);
    const startTotalSupply = await gov.totalSupply();

    await gov.transfer(account2.address, amount.toString());

    strictEqual(
      (await gov.balanceOf(account1.address)).toString(),
      new bn(startAccount1Balance.toString()).minus(amount).toString(10),
      'Invalid end account 1 balance',
    );
    strictEqual(
      (await gov.balanceOf(account2.address)).toString(),
      new bn(startAccount2Balance.toString()).plus(amount).toString(10),
      'Invalid end account 2 balance',
    );
    strictEqual((await gov.totalSupply()).toString(), startTotalSupply.toString(), 'Invalid end total supply');
  });

  it('transfer: should revert tx if exceeds balance', async function () {
    const balance = await gov.balanceOf(account2.address);

    await assertions.reverts(
      gov.connect(account2).transfer(account1.address, new bn(balance.toString()).plus(1).toString()),
      'GovernanceToken::_transferTokens: transfer amount exceeds balance',
    );
  });

  it('transfer: should revert tx if zero address', async function () {
    await assertions.reverts(
      gov.transfer(zeroAddress, (1e18).toString()),
      'GovernanceToken::_transferTokens: cannot transfer to the zero address',
    );
  });
});
