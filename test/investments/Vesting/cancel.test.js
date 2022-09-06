const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

const toBN = (v) => new bn(v.toString());
const nextBlock = () => ethers.provider.send('evm_mine');

describe('Vesting.cancel', function () {
  let vesting, token, deployer, owner;
  const amount = new bn('50');
  const duration = 6;
  before(async function () {
    [deployer, owner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('GovernanceToken');
    token = await Token.deploy(deployer.address);
    await token.deployed();

    const Vesting = await ethers.getContractFactory('Vesting');
    vesting = await Vesting.deploy();
    await vesting.deployed();
    await vesting.init(deployer.address, token.address, deployer.address);

    await token.approve(vesting.address, amount.toFixed(0));
    const currentBlock = await ethers.provider.getBlockNumber();
    await vesting.distribute(owner.address, amount.toFixed(0), currentBlock + 3, duration);
  });

  it('cancel: should revert tx if not owner call', async function () {
    await assertions.reverts(vesting.connect(owner).cancel(owner.address), 'Vesting: caller is not the admin');
  });

  it('cancel: should cancel distribution and transfer tokens', async function () {
    strictEqual(
      '0',
      await vesting
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
      await vesting
        .earned()
        .then(toBN)
        .then((v) => v.toString()),
      'Invalid earned',
    );

    const vestingBalance = await token.balanceOf(vesting.address).then(toBN);
    const adminBalance = await token.balanceOf(deployer.address).then(toBN);
    await vesting.cancel(deployer.address);
    strictEqual(
      await token.balanceOf(vesting.address).then(v => v.toString()),
      '0',
      'Invalid end vestring balance',
    );
    strictEqual(
      await token.balanceOf(deployer.address).then(v => v.toString()),
      adminBalance.plus(vestingBalance).toFixed(0),
      'Invalid end admin balance',
    );
  });

  it('cancel: should revert tx if earned is zero', async function () {
    await assertions.reverts(vesting.cancel(deployer.address), 'Vesting::cancel: already canceled');
  });

  it('cancel: should revert tx if distribution ended', async function () {
    await nextBlock();
    await nextBlock();
    await assertions.reverts(vesting.cancel(deployer.address), 'Vesting::cancel: ended');
  });
});
