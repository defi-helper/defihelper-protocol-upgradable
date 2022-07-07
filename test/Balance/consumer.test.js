const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');

describe('Balance.consumer', function () {
  let balance;
  let newConsumer;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    const Balance = await ethers.getContractFactory('Balance');
    balance = await Balance.deploy(zeroAddress);
    await balance.deployed();

    [, newConsumer] = await ethers.getSigners();
  });

  it('addConsumer: should add new consumer', async function () {
    strictEqual((await balance.consumers()).length, 0, 'Invalid start consumers list');

    await balance.addConsumer(newConsumer.address);

    strictEqual((await balance.consumers()).includes(newConsumer.address), true, 'Invalid end consumers list');
  });

  it('addConsumer: should revert tx if consumer already added', async function () {
    await assertions.reverts(balance.addConsumer(newConsumer.address), 'Balance::addConsumer: consumer already added');
  });

  it('addConsumer: should revert tx if not owner call', async function () {
    await assertions.reverts(
      balance.connect(newConsumer).addConsumer(newConsumer.address),
      'Ownable: caller is not the owner',
    );
  });

  it('removeConsumer: should remove consumer', async function () {
    strictEqual((await balance.consumers()).includes(newConsumer.address), true, 'Invalid start consumers list');

    await balance.removeConsumer(newConsumer.address);

    strictEqual((await balance.consumers()).length, 0, 'Invalid end consumers list');
  });

  it('removeConsumer: should revert tx if consumer already removed', async function () {
    await assertions.reverts(
      balance.removeConsumer(newConsumer.address),
      'Balance::removeConsumer: consumer already removed',
    );
  });

  it('removeConsumer: should revert tx if not owner call', async function () {
    await assertions.reverts(
      balance.connect(newConsumer).removeConsumer(newConsumer.address),
      'Ownable: caller is not the owner',
    );
  });

  it('addConsumer: should revert tx if consumer count maximum', async function () {
    strictEqual((await balance.consumers()).length, 0, 'Invalid start consumers list');

    const max = (await balance.MAXIMUM_CONSUMER_COUNT()).toString();
    for (let i = 0; i < max; i++) {
      const wallet = ethers.Wallet.createRandom();

      await balance.addConsumer(wallet.address);
    }
    await assertions.reverts(
      balance.addConsumer(newConsumer.address),
      'Balance::addConsumer: consumer must not exceed maximum count',
    );
  });
});
