const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('Balance.refund', function () {
  let balance;
  let account;
  const depositAmount = '1000';
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    const Balance = await ethers.getContractFactory('Balance');
    balance = await Balance.deploy(zeroAddress);
    await balance.deployed();

    [account] = await ethers.getSigners();
  });

  it('refund: should transfer refunded ETH to recipient', async function () {
    const startEthBalance = (await ethers.provider.getBalance(account.address)).toString();
    const startAccountBalance = (await balance.balanceOf(account.address)).toString();

    await balance.deposit(account.address, {
      value: depositAmount,
      gasPrice: 0,
    });
    await balance.refund(depositAmount, {
      gasPrice: 0,
    });

    strictEqual(
      (await ethers.provider.getBalance(account.address)).toString(),
      startEthBalance,
      'Invalid end ETH balance',
    );
    strictEqual(
      (await balance.balanceOf(account.address)).toString(),
      startAccountBalance,
      'Invalid end account balance',
    );
  });

  it('refund: should revert tx if amount zero', async function () {
    await assertions.reverts(
      balance.refund(0, {
        gasPrice: 0,
      }),
      'Balance::refund: negative or zero refund',
    );
  });

  it('refund: should revert tx if amount greater net balance', async function () {
    const startAccountBalance = (await balance.balanceOf(account.address)).toString();

    await assertions.reverts(
      balance.refund(new bn(startAccountBalance).plus(1).toString(10), {
        gasPrice: 0,
      }),
      'Balance::refund: refund amount exceeds net balance',
    );
  });
});
