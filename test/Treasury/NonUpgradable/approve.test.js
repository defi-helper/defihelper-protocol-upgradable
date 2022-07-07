const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('Treasury.approve', function () {
  let treasury;
  let token;
  let account, other;
  const allowanceAmount = '1000';
  before(async function () {
    const Treasury = await ethers.getContractFactory('Treasury');
    treasury = await Treasury.deploy();
    await treasury.deployed();
    const ERC20 = await ethers.getContractFactory('ERC20Mock');
    token = await ERC20.deploy('Token', 'T', allowanceAmount);
    await token.deployed();

    [account, other] = await ethers.getSigners();
    await token.transfer(treasury.address, allowanceAmount);
  });

  it('approve: should approve ERC20 to recipient', async function () {
    await treasury.approve(token.address, account.address, allowanceAmount);

    strictEqual(
      (await token.allowance(treasury.address, account.address)).toString(),
      allowanceAmount,
      'Invalid end account allowance',
    );
  });

  it('approve: should use safe approve', async function () {
    const startAccountAllowance = (await token.allowance(treasury.address, account.address)).toString();
    const newAllowanceAmount = '10';

    await treasury.approve(token.address, account.address, newAllowanceAmount);

    strictEqual(
      (await token.allowance(treasury.address, account.address)).toString(),
      newAllowanceAmount,
      'Invalid end account allowance',
    );
  });

  it('approve: should revert tx if not owner call', async function () {
    await assertions.reverts(
      treasury.connect(other).approve(token.address, account.address, allowanceAmount),
      'Ownable: caller is not the owner',
    );
  });
});
