const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');

describe('Budget.withdraw', function () {
  let budget;
  let account, recipient, notRecipient;
  const minAmount = ethers.utils.parseEther('0.1');
  const targetAmount = ethers.utils.parseEther('0.5');
  before(async function () {
    const Budget = await ethers.getContractFactory('Budget');
    budget = await Budget.deploy();
    await budget.deployed();

    [account, recipient, notRecipient] = await ethers.getSigners();
    await recipient.sendTransaction({
      to: account.address,
      value: await ethers.provider.getBalance(recipient.address),
      gasPrice: 0,
    });
    await budget.changeExpenditure(recipient.address, minAmount, targetAmount);
    await account.sendTransaction({
      to: budget.address,
      value: targetAmount,
    });
    await budget.pay();
  });

  after(async function () {
    await account.sendTransaction({
      to: recipient.address,
      value: ethers.utils.parseEther('10'),
      gasPrice: 0,
    });
  });

  it('withdraw: should transfer ETH balance to recipients', async function () {
    const startRecipientBudgetBalance = (await budget.balanceOf(recipient.address)).toString();
    const startRecipientBalance = (await ethers.provider.getBalance(recipient.address)).toString();

    strictEqual(startRecipientBudgetBalance, targetAmount.toString(), 'Invalid start recipient budget balance');
    strictEqual(startRecipientBalance, '0', 'Invalid start recipient balance');

    await budget.connect(recipient).withdraw({
      gasPrice: 0,
    });

    strictEqual((await budget.balanceOf(recipient.address)).toString(), '0', 'Invalid end recipient budget balance');
    strictEqual((await budget.totalSupply()).toString(), '0', 'Invalid end total supply budget');
    strictEqual(
      (await ethers.provider.getBalance(recipient.address)).toString(),
      targetAmount.toString(),
      'Invalid end recipient balance',
    );
  });

  it('withdraw: should revert tx if balance zero', async function () {
    await assertions.reverts(
      budget.connect(notRecipient).withdraw(),
      'Budget::withdraw: transfer amount exceeds balance',
    );
  });
});
