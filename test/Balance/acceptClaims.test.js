const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('Balance.acceptClaims', function () {
  let balance;
  let account;
  const depositAmount = '1000';
  const claimGasFee = '100';
  const claimProtocolFee = '300';
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  const billStatusAccepted = 1;
  before(async function () {
    const Balance = await ethers.getContractFactory('Balance');
    balance = await Balance.deploy(zeroAddress);
    await balance.deployed();

    [account, consumer, inspector, treasury] = await ethers.getSigners();

    await balance.deposit(account.address, {
      value: depositAmount,
      gasPrice: 0,
    });
    await balance.addConsumer(consumer.address);
    await balance.addInspector(inspector.address);
    await balance.changeTreasury(treasury.address);
  });

  it('acceptClaims: should accept claims', async function () {
    await balance.connect(consumer).claim(account.address, claimGasFee, claimProtocolFee, '');
    const bill1Id = await balance.billCount();
    await balance.connect(consumer).claim(account.address, claimGasFee, claimProtocolFee, '');
    const bill2Id = await balance.billCount();
    const startAccountBalance = (await balance.balanceOf(account.address)).toString();
    const startAccountNetBalance = (await balance.netBalanceOf(account.address)).toString();
    const startAccountClaim = (await balance.claimOf(account.address)).toString();
    const startTreasuryBalance = (await ethers.provider.getBalance(treasury.address)).toString();

    await balance.connect(inspector).acceptClaims([bill1Id, bill2Id], [claimGasFee, '0'], [claimProtocolFee, '0']);

    strictEqual(
      (await balance.balanceOf(account.address)).toString(),
      new bn(startAccountBalance).minus(claimGasFee).minus(claimProtocolFee).toString(10),
      'Invalid end account net balance',
    );
    strictEqual(
      (await balance.netBalanceOf(account.address)).toString(),
      new bn(startAccountNetBalance).plus(claimGasFee).plus(claimProtocolFee).toString(10),
      'Invalid end account net balance',
    );
    strictEqual(
      (await balance.claimOf(account.address)).toString(),
      new bn(startAccountClaim)
        .minus(claimGasFee)
        .minus(claimGasFee)
        .minus(claimProtocolFee)
        .minus(claimProtocolFee)
        .toString(10),
      'Invalid end account claim',
    );
    strictEqual(
      (await ethers.provider.getBalance(treasury.address)).toString(),
      new bn(startTreasuryBalance).plus(claimGasFee).plus(claimProtocolFee).toString(10),
      'Invalid end treasury balance',
    );

    const bill1 = await balance.bills(bill1Id);
    const bill2 = await balance.bills(bill2Id);

    strictEqual(bill1.status, billStatusAccepted, 'Invalid bill 1 status');
    strictEqual(bill2.status, billStatusAccepted, 'Invalid bill 2 status');
  });

  it('acceptClaims: should revert tx if bill already rejected', async function () {
    const billId = await balance.billCount();
    await assertions.reverts(
      balance.connect(inspector).acceptClaims([billId], [0], [0]),
      'Balance::acceptClaims: bill already processed',
    );
  });

  it('acceptClaims: should revert tx if arity mismatch', async function () {
    const billId = await balance.billCount();
    await assertions.reverts(
      balance.connect(inspector).acceptClaims([], [0], [0]),
      'Balance::acceptClaims: arity mismatch',
    );
    await assertions.reverts(
      balance.connect(inspector).acceptClaims([billId], [], [0]),
      'Balance::acceptClaims: arity mismatch',
    );
    await assertions.reverts(
      balance.connect(inspector).acceptClaims([billId], [0], []),
      'Balance::acceptClaims: arity mismatch',
    );
  });

  it('acceptClaims: should revert tx if bill count maximum', async function () {
    const max = (await balance.MAXIMUM_CLAIM_PACKAGE()).toNumber();
    await assertions.reverts(
      balance
        .connect(inspector)
        .acceptClaims(
          Array.from(new Array(max + 1).keys()),
          Array.from(new Array(max + 1).keys()),
          Array.from(new Array(max + 1).keys()),
        ),
      'Balance::acceptClaims: too many claims',
    );
  });

  it('acceptClaims: should revert tx if bill not found', async function () {
    const billId = await balance.billCount();
    await assertions.reverts(
      balance.connect(inspector).acceptClaims([billId + 1], [0], [0]),
      'Balance::acceptClaims: bill not found',
    );
  });

  it('acceptClaims: should revert tx if not inspector call', async function () {
    await assertions.reverts(balance.acceptClaims([], [], []), 'Balance: caller is not the inspector');
  });
});
