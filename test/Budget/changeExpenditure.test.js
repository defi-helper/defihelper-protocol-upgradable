const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');

describe('Budget.changeExpenditure', function () {
  let budget;
  let recipient;
  const minAmount = '10';
  const targetAmount = '100';
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    const Budget = await ethers.getContractFactory('Budget');
    budget = await Budget.deploy();
    await budget.deployed();

    [, recipient] = await ethers.getSigners();
  });

  it('changeExpenditure: should add new expenditure', async function () {
    strictEqual((await budget.recipients()).length, 0, 'Invalid start recipients count');

    await budget.changeExpenditure(recipient.address, minAmount, targetAmount);

    const expenditure = await budget.expenditures(recipient.address);
    strictEqual((await budget.recipients()).length, 1, 'Invalid end recipients count');
    strictEqual(expenditure.recipient, recipient.address, 'Invalid expenditure address');
    strictEqual(expenditure.min.toString(), minAmount, 'Invalid expenditure min');
    strictEqual(expenditure.target.toString(), targetAmount, 'Invalid expenditure target');
  });

  it('changeExpenditure: should update expenditure', async function () {
    const updatedMinAmount = '100';
    const updatedTargetAmount = '1000';

    await budget.changeExpenditure(recipient.address, updatedMinAmount, updatedTargetAmount);

    const expenditure = await budget.expenditures(recipient.address);
    strictEqual((await budget.recipients()).length, 1, 'Invalid end recipients count');
    strictEqual(expenditure.recipient, recipient.address, 'Invalid expenditure address');
    strictEqual(expenditure.min.toString(), updatedMinAmount, 'Invalid expenditure min');
    strictEqual(expenditure.target.toString(), updatedTargetAmount, 'Invalid expenditure target');
  });

  it('changeExpenditure: should remove expenditure', async function () {
    await budget.changeExpenditure(recipient.address, 0, 0);

    const expenditure = await budget.expenditures(recipient.address);
    strictEqual((await budget.recipients()).length, 0, 'Invalid end recipients count');
    strictEqual(expenditure.recipient, recipient.address, 'Invalid expenditure address');
    strictEqual(expenditure.min.toString(), '0', 'Invalid expenditure min');
    strictEqual(expenditure.target.toString(), '0', 'Invalid expenditure target');
  });

  it('acceptClaims: should revert tx if min greater target', async function () {
    await assertions.reverts(
      budget.changeExpenditure(recipient.address, 10, 5),
      'Budget::changeExpenditure: minimal balance should be less or equal target balance',
    );
  });

  it('acceptClaims: should revert tx if recipient zero', async function () {
    await assertions.reverts(
      budget.changeExpenditure(zeroAddress, minAmount, targetAmount),
      'Budget::changeExpenditure: invalid recipient',
    );
  });

  it('acceptClaims: should revert tx if recipient count maximum', async function () {
    strictEqual((await budget.recipients()).length, 0, 'Invalid start recipient list');

    const max = (await budget.MAXIMUM_RECIPIENT_COUNT()).toString();
    for (let i = 0; i < max; i++) {
      const wallet = ethers.Wallet.createRandom();

      await budget.changeExpenditure(wallet.address, minAmount, targetAmount);
    }
    await assertions.reverts(
      budget.changeExpenditure(recipient.address, minAmount, targetAmount),
      'Budget::changeExpenditure: recipient must not exceed maximum count',
    );
  });

  it('acceptClaims: should revert tx if not owner', async function () {
    await assertions.reverts(
      budget.connect(recipient).changeExpenditure(recipient.address, 0, 0),
      'Ownable: caller is not the owner',
    );
  });
});
