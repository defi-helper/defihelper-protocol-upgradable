const { strictEqual } = require('assert');
const { ethers } = require('hardhat');

describe('Budget.pay', function () {
  let budget;
  let account, recipientA, recipientB;
  const minAmount = ethers.utils.parseEther('0.1');
  const targetAmount = ethers.utils.parseEther('0.5');
  before(async function () {
    const Budget = await ethers.getContractFactory('Budget');
    budget = await Budget.deploy();
    await budget.deployed();

    [account, recipientA, recipientB] = await ethers.getSigners();
    await recipientA.sendTransaction({
      to: account.address,
      value: await ethers.provider.getBalance(recipientA.address),
      gasPrice: 0,
    });
    await recipientB.sendTransaction({
      to: account.address,
      value: (await ethers.provider.getBalance(recipientB.address)).sub(minAmount.toString()),
      gasPrice: 0,
    });
    await budget.changeExpenditure(recipientA.address, minAmount, targetAmount);
    await budget.changeExpenditure(recipientB.address, minAmount, targetAmount);
    await account.sendTransaction({
      to: budget.address,
      value: targetAmount,
    });
  });

  after(async function () {
    await account.sendTransaction({
      to: recipientA.address,
      value: ethers.utils.parseEther('10'),
      gasPrice: 0,
    });
    await account.sendTransaction({
      to: recipientB.address,
      value: ethers.utils.parseEther('10'),
      gasPrice: 0,
    });
  });

  it('pay: should pay ETH to recipients', async function () {
    const startDeficitToRecipientA = (await budget.deficitTo(recipientA.address)).toString();
    const startDeficitToRecipientB = (await budget.deficitTo(recipientB.address)).toString();
    const startDeficitBudget = (await budget.deficit()).toString();
    const startTotalSupplyBudget = (await budget.totalSupply()).toString();

    strictEqual(startDeficitToRecipientA, targetAmount.toString(), 'Invalid start deficit of recipient A');
    strictEqual(startDeficitToRecipientB, '0', 'Invalid start deficit of recipient B');
    strictEqual(startDeficitBudget, targetAmount.toString(), 'Invalid start deficit of budget');
    strictEqual(startTotalSupplyBudget, '0', 'Invalid start total supply of budget');

    await budget.pay();

    strictEqual(
      (await budget.balanceOf(recipientA.address)).toString(),
      targetAmount.toString(),
      'Invalid end balance of recipient A',
    );
    strictEqual((await budget.deficitTo(recipientA.address)).toString(), '0', 'Invalid end deficit of recipient A');
    strictEqual((await budget.deficit()).toString(), '0', 'Invalid end deficit of budget');
    strictEqual((await budget.totalSupply()).toString(), targetAmount.toString(), 'Invalid end total supply of budget');
  });
});
