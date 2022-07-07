const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('Budget.transferETH', function () {
  let budget;
  let account, other;
  const transferAmount = ethers.utils.parseEther('1.0');
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    const Budget = await ethers.getContractFactory('Budget');
    budget = await Budget.deploy();
    await budget.deployed();

    [account, other] = await ethers.getSigners();
    await account.sendTransaction({
      to: budget.address,
      value: transferAmount,
    });
  });

  it('transferETH: should transfer ETH to recipient', async function () {
    const startAccountBalance = (await ethers.provider.getBalance(account.address)).toString();
    const startBudgetBalance = (await ethers.provider.getBalance(budget.address)).toString();

    await budget.transferETH(account.address, transferAmount.toString(), {
      gasPrice: 0,
    });

    strictEqual(
      (await ethers.provider.getBalance(account.address)).toString(),
      new bn(startAccountBalance).plus(transferAmount.toString()).toString(10),
      'Invalid end account balance',
    );
    strictEqual(
      (await ethers.provider.getBalance(budget.address)).toString(),
      new bn(startBudgetBalance).minus(transferAmount.toString()).toString(10),
      'Invalid end budget balance',
    );
  });

  it('transferETH: should revert tx if amount zero', async function () {
    await assertions.reverts(budget.transferETH(account.address, 0), 'Budget::transferETH: negative or zero amount');
  });

  it('transferETH: should revert tx if recipient is zero address', async function () {
    await assertions.reverts(budget.transferETH(zeroAddress, transferAmount), 'Budget::transferETH: invalid recipient');
  });

  it('transferETH: should revert tx if not owner call', async function () {
    await assertions.reverts(
      budget.connect(other).transferETH(account.address, transferAmount),
      'Ownable: caller is not the owner',
    );
  });
});
