const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

const toBN = (v) => new bn(v.toString());

describe('Vesting.distribute', function () {
  let vesting, token, deployer, owner;
  before(async function () {
    [deployer, owner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('GovernanceToken');
    token = await Token.deploy(deployer.address);
    await token.deployed();

    const Vesting = await ethers.getContractFactory('Vesting');
    vesting = await Vesting.deploy();
    await vesting.deployed();
    await vesting.init(token.address, deployer.address);
  });

  it('distribute: should revert if not owner call', async function () {
    await assertions.reverts(
      vesting.connect(owner).distribute(owner.address, 1, 10),
      'Vesting: caller is not the owner',
    );
  });

  it('distribute: should revert if invalid recipient address', async function () {
    await assertions.reverts(
      vesting.distribute('0x0000000000000000000000000000000000000000', 1, 10),
      'Vesting::distribute: invalid recipient',
    );
  });

  it('distribute: should revert if invalid amount', async function () {
    await assertions.reverts(vesting.distribute(owner.address, 0, 10), 'Vesting::distribute: invalid amount');
  });

  it('distribute: should revert if invalid duration', async function () {
    await assertions.reverts(vesting.distribute(owner.address, 1, 0), 'Vesting::distribute: invalid duration');
  });

  it('distribute: should start distribution token', async function () {
    const amount = new bn('100e18');
    const duration = 10;

    strictEqual(deployer.address, await vesting.owner(), 'Invalid start owner');
    strictEqual(
      '0',
      await token
        .getCurrentVotes(owner.address)
        .then(toBN)
        .then((v) => v.toString(10)),
      'Invalid start votes',
    );

    await token.approve(vesting.address, amount.toFixed(0));
    await vesting.distribute(owner.address, amount.toFixed(0), 10);

    strictEqual(
      amount.toString(10),
      await token
        .balanceOf(vesting.address)
        .then(toBN)
        .then((v) => v.toString(10)),
      'Invalid end balance',
    );
    strictEqual(owner.address, await vesting.owner(), 'Invalid end owner');
    strictEqual(
      amount.toString(10),
      await token
        .getCurrentVotes(owner.address)
        .then(toBN)
        .then((v) => v.toString(10)),
      'Invalid end votes',
    );
    strictEqual(owner.address, await token.delegates(vesting.address), 'Invalid delegates');
    strictEqual(
      amount.div(duration).toString(10),
      await vesting
        .rate()
        .then(toBN)
        .then((v) => v.toString(10)),
      'Invalid reward rate',
    );
  });

  it('distribute: should revert if already distributeialized', async function () {
    await assertions.reverts(
      vesting.connect(owner).distribute(owner.address, 1, 10),
      'Vesting::distribute: already distributed',
    );
  });
});
