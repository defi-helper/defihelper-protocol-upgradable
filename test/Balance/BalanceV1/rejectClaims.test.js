const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers, upgrades } = require('hardhat');

describe('Balance.rejectClaims', function () {
  let balance, treasury;
  let account;
  const depositAmount = '1000';
  const claimGasFee = '100';
  const claimProtocolFee = '300';
  const billStatusRejected = 2;
  before(async function () {
    const Treasury = await ethers.getContractFactory('contracts/Treasury/TreasuryV2.sol:TreasuryV2');
    treasury = await upgrades.deployProxy(Treasury);
    await treasury.deployed();

    const Balance = await ethers.getContractFactory('contracts/Balance/BalanceV1.sol:BalanceV1');
    balance = await upgrades.deployProxy(Balance, [treasury.address], {
      initializer: 'initialize',
    });
    await balance.deployed();

    [account, consumer, inspector] = await ethers.getSigners();

    await balance.deposit(account.address, {
      value: depositAmount,
      gasPrice: 0,
    });
    await balance.addConsumer(consumer.address);
    await balance.addInspector(inspector.address);
  });

  it('rejectClaims: should reject claims', async function () {
    const startAccountNetBalance = (await balance.netBalanceOf(account.address)).toString();
    const startAccountClaim = (await balance.claimOf(account.address)).toString();

    await balance.connect(consumer).claim(account.address, claimGasFee, claimProtocolFee, '');
    const bill1Id = await balance.billCount();
    await balance.connect(consumer).claim(account.address, claimGasFee, claimProtocolFee, '');
    const bill2Id = await balance.billCount();
    await balance.connect(inspector).rejectClaims([bill1Id, bill2Id]);

    strictEqual(
      (await balance.netBalanceOf(account.address)).toString(),
      startAccountNetBalance,
      'Invalid end account net balance',
    );
    strictEqual((await balance.claimOf(account.address)).toString(), startAccountClaim, 'Invalid end account claim');

    const bill1 = await balance.bills(bill1Id);
    const bill2 = await balance.bills(bill2Id);

    strictEqual(bill1.status, billStatusRejected, 'Invalid bill 1 status');
    strictEqual(bill2.status, billStatusRejected, 'Invalid bill 2 status');
  });

  it('rejectClaims: should revert tx if bill already rejected', async function () {
    const billId = await balance.billCount();
    await assertions.reverts(
      balance.connect(inspector).rejectClaims([billId]),
      'Balance::rejectClaims: bill already processed',
    );
  });

  it('rejectClaims: should revert tx if bill count maximum', async function () {
    const max = (await balance.MAXIMUM_CLAIM_PACKAGE()).toNumber();
    await assertions.reverts(
      balance.connect(inspector).rejectClaims(Array.from(new Array(max + 1).keys())),
      'Balance::rejectClaims: too many claims',
    );
  });

  it('rejectClaims: should revert tx if bill not found', async function () {
    const billId = await balance.billCount();
    await assertions.reverts(
      balance.connect(inspector).rejectClaims([billId + 1]),
      'Balance::rejectClaims: bill not found',
    );
  });

  it('rejectClaims: should revert tx if not inspector call', async function () {
    await assertions.reverts(balance.rejectClaims([]), 'Balance: caller is not the inspector');
  });
});
