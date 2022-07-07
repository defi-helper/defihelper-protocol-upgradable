const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('Treasury.transfer', function () {
  let treasury;
  let token;
  let account, other;
  const transferAmount = '1000';
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    const Treasury = await ethers.getContractFactory('Treasury');
    treasury = await Treasury.deploy();
    await treasury.deployed();
    const ERC20 = await ethers.getContractFactory('ERC20Mock');
    token = await ERC20.deploy('Token', 'T', transferAmount);
    await token.deployed();

    [account, other] = await ethers.getSigners();
    await token.transfer(treasury.address, transferAmount);
  });

  it('transfer: should transfer ERC20 to recipient', async function () {
    const startAccountBalance = (await token.balanceOf(account.address)).toString();
    const startTreasuryBalance = (await token.balanceOf(treasury.address)).toString();

    await treasury.transfer(token.address, account.address, transferAmount);

    strictEqual(
      (await token.balanceOf(account.address)).toString(),
      new bn(startAccountBalance).plus(transferAmount).toString(10),
      'Invalid end account balance',
    );
    strictEqual(
      (await token.balanceOf(treasury.address)).toString(),
      new bn(startTreasuryBalance).minus(transferAmount).toString(10),
      'Invalid end treasury balance',
    );
  });

  it('transfer: should revert tx if amount zero', async function () {
    await assertions.reverts(
      treasury.transfer(token.address, account.address, 0),
      'Treasury::transfer: negative or zero amount',
    );
  });

  it('transfer: should revert tx if recipient is zero address', async function () {
    await assertions.reverts(
      treasury.transfer(token.address, zeroAddress, transferAmount),
      'Treasury::transfer: invalid recipient',
    );
  });

  it('transfer: should revert tx if not owner call', async function () {
    await assertions.reverts(
      treasury.connect(other).transfer(token.address, account.address, transferAmount),
      'Ownable: caller is not the owner',
    );
  });
});
