const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('WrapMock', function () {
  let wrap, account;
  before(async function () {
    [account] = await ethers.getSigners();

    const WrapMock = await ethers.getContractFactory('WrapMock');
    wrap = await WrapMock.deploy('WETH', 'Wrapped ETH');
    await wrap.deployed();
  });

  it('deposit: should swap native token to wrapped token', async function () {
    const startETHBalance = await ethers.provider.getBalance(account.address).then((v) => v.toString());
    const startTokenBalance = await wrap.balanceOf(account.address).then((v) => v.toString());

    const amount = new bn('10e18').toFixed(0);
    await wrap.deposit({ value: amount, gasPrice: '0' });

    strictEqual(
      await ethers.provider.getBalance(account.address).then((v) => v.toString()),
      new bn(startETHBalance).minus(amount).toFixed(0),
      'Invalid ETH balance',
    );
    strictEqual(
      await wrap.balanceOf(account.address).then((v) => v.toString()),
      new bn(startTokenBalance).plus(amount).toFixed(0),
      'Invalid token balance',
    );
  });

  it('withdraw: should swap wrapped token to native token', async function () {
    const startETHBalance = await ethers.provider.getBalance(account.address).then((v) => v.toString());
    const startTokenBalance = await wrap.balanceOf(account.address).then((v) => v.toString());

    const amount = new bn('10e18').toFixed(0);
    await wrap.withdraw(amount, { gasPrice: '0' });

    strictEqual(
      await ethers.provider.getBalance(account.address).then((v) => v.toString()),
      new bn(startETHBalance).plus(amount).toFixed(0),
      'Invalid ETH balance',
    );
    strictEqual(
      await wrap.balanceOf(account.address).then((v) => v.toString()),
      new bn(startTokenBalance).minus(amount).toFixed(0),
      'Invalid token balance',
    );
  });
});
