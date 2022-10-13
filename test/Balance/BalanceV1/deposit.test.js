const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers, upgrades } = require('hardhat');
const bn = require('bignumber.js');

describe('Balance.deposit', function () {
  let balance, treasury;
  let account;
  const depositAmount = '1000';
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    const Treasury = await ethers.getContractFactory('contracts/Treasury/TreasuryV2.sol:TreasuryV2');
    treasury = await upgrades.deployProxy(Treasury);
    await treasury.deployed();

    const Balance = await ethers.getContractFactory('contracts/Balance/BalanceV1.sol:BalanceV1');
    balance = await upgrades.deployProxy(Balance, [treasury.address], {
      initializer: 'initialize',
    });
    await balance.deployed();

    [account] = await ethers.getSigners();
  });

  it('deposit: should transfer ETH to account balance', async function () {
    const startEthBalance = (await ethers.provider.getBalance(account.address)).toString();
    const startAccountBalance = (await balance.balanceOf(account.address)).toString();

    await balance.deposit(account.address, {
      value: depositAmount,
      gasPrice: 0,
    });

    strictEqual(
      (await ethers.provider.getBalance(account.address)).toString(),
      new bn(startEthBalance).minus(depositAmount).toString(10),
      'Invalid end ETH balance',
    );
    strictEqual(
      (await balance.balanceOf(account.address)).toString(),
      new bn(startAccountBalance).plus(depositAmount).toString(10),
      'Invalid end account balance',
    );
  });

  it('deposit: should revert tx if recipient is zero address', async function () {
    await assertions.reverts(
      balance.deposit(zeroAddress, {
        value: depositAmount,
        gasPrice: 0,
      }),
      'Balance::deposit: invalid recipient',
    );
  });

  it('deposit: should revert tx if amount zero', async function () {
    await assertions.reverts(
      balance.deposit(account.address, {
        value: 0,
        gasPrice: 0,
      }),
      'Balance::deposit: negative or zero deposit',
    );
  });
});
