const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

const toBN = (v) => new bn(v.toString());

describe('Option.distribute', function () {
  let option, token, deployer, owner;
  before(async function () {
    [deployer, owner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('GovernanceToken');
    token = await Token.deploy(deployer.address);
    await token.deployed();

    const Option = await ethers.getContractFactory('Option');
    option = await Option.deploy();
    await option.deployed();
    await option.init(deployer.address, token.address, deployer.address);
  });

  it('distribute: should revert if not owner call', async function () {
    const currentBlock = await ethers.provider.getBlockNumber();
    await assertions.reverts(
        option.connect(owner).distribute(owner.address, 1, currentBlock + 1, 10),
      'Option: caller is not the owner',
    );
  });

  it('distribute: should revert if invalid recipient address', async function () {
    const currentBlock = await ethers.provider.getBlockNumber();
    await assertions.reverts(
        option.distribute('0x0000000000000000000000000000000000000000', 1, currentBlock + 1, 10),
      'Option::distribute: invalid recipient',
    );
  });

  it('distribute: should revert if invalid amount', async function () {
    const currentBlock = await ethers.provider.getBlockNumber();
    await assertions.reverts(
        option.distribute(owner.address, 0, currentBlock + 1, 10),
      'Option::distribute: invalid amount',
    );
  });

  it('distribute: should revert if invalid duration', async function () {
    const currentBlock = await ethers.provider.getBlockNumber();
    await assertions.reverts(
        option.distribute(owner.address, 1, currentBlock + 1, 0),
      'Option::distribute: invalid duration',
    );
  });

  it('distribute: should revert if invalid start', async function () {
    const currentBlock = await ethers.provider.getBlockNumber();
    await assertions.reverts(
        option.distribute(owner.address, 1, currentBlock - 1, 10),
      'Option::distribute: invalid start',
    );
  });

  it('distribute: should start distribution token', async function () {
    const amount = new bn('100e18');
    const duration = 10;

    strictEqual(deployer.address, await option.owner(), 'Invalid start owner');
    strictEqual(
      '0',
      await token
        .getCurrentVotes(owner.address)
        .then(toBN)
        .then((v) => v.toString(10)),
      'Invalid start votes',
    );

    await token.approve(option.address, amount.toFixed(0));
    const currentBlock = await ethers.provider.getBlockNumber();
    await option.distribute(owner.address, amount.toFixed(0), currentBlock + 1, 10);

    strictEqual(
      amount.toString(10),
      await token
        .balanceOf(option.address)
        .then(toBN)
        .then((v) => v.toString(10)),
      'Invalid end balance',
    );
    strictEqual(owner.address, await option.owner(), 'Invalid end owner');
    strictEqual(
      amount.toString(10),
      await token
        .getCurrentVotes(owner.address)
        .then(toBN)
        .then((v) => v.toString(10)),
      'Invalid end votes',
    );
    strictEqual(owner.address, await token.delegates(option.address), 'Invalid delegates');
    strictEqual(
      amount.div(duration).toString(10),
      await option
        .rate()
        .then(toBN)
        .then((v) => v.toString(10)),
      'Invalid reward rate',
    );
  });

  it('distribute: should revert if already distributeialized', async function () {
    const currentBlock = await ethers.provider.getBlockNumber();
    await assertions.reverts(
        option.connect(owner).distribute(owner.address, 1, currentBlock + 1, 10),
      'Option::distribute: already distributed',
    );
  });
});
