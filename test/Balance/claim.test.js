const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('Balance.claim', function () {
  let balance;
  let account, consumer, notConsumer;
  const depositAmount = '2000';
  const claimGasFee = '100';
  const claimProtocolFee = '300';
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  const billStatusPending = 0;
  before(async function () {
    const Balance = await ethers.getContractFactory('Balance');
    balance = await Balance.deploy(zeroAddress);
    await balance.deployed();
    const BalanceConsumerMock = await ethers.getContractFactory('BalanceConsumerMock');
    consumerMock = await BalanceConsumerMock.deploy(balance.address);
    await consumerMock.deployed();

    [account, consumer, notConsumer] = await ethers.getSigners();

    await balance.deposit(account.address, {
      value: depositAmount,
      gasPrice: 0,
    });
    await balance.addConsumer(consumer.address);
  });

  it('claim: should claim balance and make bill', async function () {
    const startAccountBalance = (await balance.balanceOf(account.address)).toString();
    const startAccountNetBalance = (await balance.netBalanceOf(account.address)).toString();
    const startAccountClaim = (await balance.claimOf(account.address)).toString();

    strictEqual((await balance.billCount()).toString(), '0', 'Invalid start bill count');

    await balance.connect(consumer).claim(account.address, claimGasFee, claimProtocolFee, '');

    strictEqual(
      (await balance.balanceOf(account.address)).toString(),
      startAccountBalance,
      'Invalid end account balance',
    );
    strictEqual(
      (await balance.netBalanceOf(account.address)).toString(),
      new bn(startAccountNetBalance).minus(claimGasFee).minus(claimProtocolFee).toString(10),
      'Invalid end account net balance',
    );
    strictEqual(
      (await balance.claimOf(account.address)).toString(),
      new bn(startAccountClaim).plus(claimGasFee).plus(claimProtocolFee).toString(10),
      'Invalid end account claim',
    );
    strictEqual((await balance.billCount()).toString(), '1', 'Invalid end bill count');

    const billId = (await balance.billCount()).toString();
    const bill = await balance.bills(billId);

    strictEqual(bill.id.toString(), billId, 'Invalid new bill id');
    strictEqual(bill.account, account.address, 'Invalid new bill account');
    strictEqual(bill.gasFee.toString(), claimGasFee, 'Invalid new bill gas fee');
    strictEqual(bill.protocolFee.toString(), claimProtocolFee, 'Invalid new bill protocol fee');
    strictEqual(bill.status, billStatusPending, 'Invalid new bill status');
  });

  it('claim: should revert tx if amount zero', async function () {
    await assertions.reverts(
      balance.connect(consumer).claim(account.address, 0, 0, ''),
      'Balance::claim: negative or zero claim',
    );
  });

  it('claim: should revert tx if amount greater net balance', async function () {
    await assertions.reverts(
      balance.connect(consumer).claim(account.address, depositAmount, depositAmount, ''),
      'Balance::claim: claim amount exceeds net balance',
    );
  });

  it('claim: should revert tx if not consumer call', async function () {
    await assertions.reverts(
      balance.connect(notConsumer).claim(account.address, claimGasFee, claimProtocolFee, ''),
      'Balance: caller is not a consumer',
    );
  });

  it('claim: should claim balance and make bill with account self call', async function () {
    await consumerMock.connect(account).consume(account.address, claimGasFee, claimProtocolFee, '');
  });

  it('claim: should claim balance and make bill with middleware contract', async function () {
    await consumerMock.connect(consumer).consume(account.address, claimGasFee, claimProtocolFee, '');
  });

  it('claim: should revert tx if not consumer call with middleware contract', async function () {
    await assertions.reverts(
      consumerMock.connect(notConsumer).consume(account.address, claimGasFee, claimProtocolFee, ''),
      'Balance: caller is not a consumer',
    );
  });
});
