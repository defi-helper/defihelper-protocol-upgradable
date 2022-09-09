const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

const toBN = (v) => new bn(v.toString());
const nextBlock = () => ethers.provider.send('evm_mine');

describe('Option.cancel', function () {
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
    await option.distribute(owner.address, amount.toFixed(0), currentBlock + 3, duration);
  });

  it('cancel: should revert tx if not owner call', async function () {
    await assertions.reverts(option.connect(owner).cancel(owner.address), 'Option: caller is not the admin');
  });

  it('cancel: should cancel distribution and transfer tokens', async function () {
    strictEqual(
      '0',
      await option
        .earned()
        .then(toBN)
        .then((v) => v.toString()),
      'Invalid prestart earned',
    );
    await nextBlock();
    await nextBlock();
    await nextBlock();
    strictEqual(
      '16',
      await option
        .earned()
        .then(toBN)
        .then((v) => v.toString()),
      'Invalid earned',
    );

    const optionBalance = await token.balanceOf(option.address).then(toBN);
    const adminBalance = await token.balanceOf(deployer.address).then(toBN);
    await option.cancel(deployer.address);
    strictEqual(
      await token.balanceOf(option.address).then(v => v.toString()),
      '0',
      'Invalid end vestring balance',
    );
    strictEqual(
      await token.balanceOf(deployer.address).then(v => v.toString()),
      adminBalance.plus(optionBalance).toFixed(0),
      'Invalid end admin balance',
    );
  });

  it('cancel: should revert tx if earned is zero', async function () {
    await assertions.reverts(option.cancel(deployer.address), 'Option::cancel: already canceled');
  });

  it('cancel: should revert tx if distribution ended', async function () {
    await nextBlock();
    await nextBlock();
    await assertions.reverts(option.cancel(deployer.address), 'Option::cancel: ended');
  });
});
