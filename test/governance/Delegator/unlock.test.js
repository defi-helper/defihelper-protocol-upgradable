const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');

describe('Delegator.unlock', function () {
  let token, delegator, owner, governor, notOwner;
  const amount = '100';
  before(async function () {
    [owner, governor, notOwner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('GovernanceToken');
    token = await Token.deploy(owner.address);
    await token.deployed();

    const Delegator = await ethers.getContractFactory('Delegator');
    delegator = await Delegator.deploy(token.address, governor.address);
    await delegator.deployed();
  });

  it('transfer: should tranfer tokens from account and delegate votes to governor', async function () {
    strictEqual(await token.balanceOf(delegator.address).then((v) => v.toString()), '0', 'Invalid start balance');
    strictEqual(
      await token.getCurrentVotes(governor.address).then((v) => v.toString()),
      '0',
      'Invalid start governor votes',
    );

    await token.transfer(delegator.address, amount);

    strictEqual(await token.balanceOf(delegator.address).then((v) => v.toString()), amount, 'Invalid end balance');
    strictEqual(
      await token.getCurrentVotes(governor.address).then((v) => v.toString()),
      amount,
      'Invalid end governor votes',
    );
  });

  it('unlock: should revert tx if not owner call', async function () {
    await assertions.reverts(
      delegator.connect(notOwner).unlock(owner.address, '100'),
      'Ownable: caller is not the owner',
    );
  });

  it('unlock: should revert tx if zero address', async function () {
    await assertions.reverts(
      delegator.unlock('0x0000000000000000000000000000000000000000', amount),
      'Delegator::unlock: cannot transfer to the zero address',
    );
  });

  it('unlock: should tranfer tokens from delegator to recipient', async function () {
    strictEqual(await token.balanceOf(delegator.address).then((v) => v.toString()), amount, 'Invalid start balance');
    strictEqual(
      await token.getCurrentVotes(governor.address).then((v) => v.toString()),
      amount,
      'Invalid start governor votes',
    );

    await delegator.unlock(owner.address, amount);

    strictEqual(await token.balanceOf(delegator.address).then((v) => v.toString()), '0', 'Invalid end balance');
    strictEqual(
      await token.getCurrentVotes(governor.address).then((v) => v.toString()),
      '0',
      'Invalid end governor votes',
    );
  });
});
