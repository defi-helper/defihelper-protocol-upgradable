const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

const toBN = (v) => new bn(v.toString());
const nextBlock = () => ethers.provider.send('evm_mine');

describe('Option.claim', function () {
  let option, token, deployer, owner;
  const amount = new bn('50');
  const duration = 6;
  before(async function () {
    [deployer, owner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('GovernanceToken');
    token = await Token.deploy(deployer.address);
    await token.deployed();

    const Option = await ethers.getContractFactory('Option');
    option = await Option.deploy();
    await option.deployed();
    await option.init(deployer.address, token.address, deployer.address);

    await token.approve(option.address, amount.toFixed(0));
    const currentBlock = await ethers.provider.getBlockNumber();
    await option.distribute(owner.address, amount.toFixed(0), currentBlock + 4, duration);
  });

  it('claim: should revert tx if not owner call', async function () {
    await assertions.reverts(option.claim(), 'Option: caller is not the owner');
  });

  it('claim: should claim tokens', async function () {
    strictEqual(
      '0',
      await option
        .earned()
        .then(toBN)
        .then((v) => v.toString()),
      'Invalid prestart earned',
    );
    await nextBlock();
    await assertions.reverts(option.connect(owner).claim(), 'Option::claim: empty');
    await nextBlock();

    strictEqual(
      '8',
      await option
        .earned()
        .then(toBN)
        .then((v) => v.toString()),
      'Invalid 1 earned',
    );
    strictEqual(
      '0',
      await token
        .balanceOf(owner.address)
        .then(toBN)
        .then((v) => v.toString()),
      'Invalid 1 balance',
    );

    await nextBlock();
    strictEqual(
      '16',
      await option
        .earned()
        .then(toBN)
        .then((v) => v.toString()),
      'Invalid 2 earned',
    );

    await option.connect(owner).claim();
    strictEqual(
      '0',
      await option
        .earned()
        .then(toBN)
        .then((v) => v.toString()),
      'Invalid 3 earned',
    );
    strictEqual(
      '24',
      await token
        .balanceOf(owner.address)
        .then(toBN)
        .then((v) => v.toString()),
      'Invalid 2 balance',
    );

    await nextBlock();
    await nextBlock();
    await nextBlock();
    await nextBlock();
    strictEqual(
      '26',
      await option
        .earned()
        .then(toBN)
        .then((v) => v.toString()),
      'Invalid 4 earned',
    );

    await option.connect(owner).claim();
    strictEqual(
      '0',
      await option
        .earned()
        .then(toBN)
        .then((v) => v.toString()),
      'Invalid 5 earned',
    );
    strictEqual(
      '50',
      await token
        .balanceOf(owner.address)
        .then(toBN)
        .then((v) => v.toString()),
      'Invalid 3 balance',
    );

    await nextBlock();
    strictEqual(
      '0',
      await option
        .earned()
        .then(toBN)
        .then((v) => v.toString()),
      'Invalid 6 earned',
    );
  });

  it('claim: should revert tx if earned is zero', async function () {
    await assertions.reverts(option.connect(owner).claim(), 'Option::claim: empty');
  });
});
