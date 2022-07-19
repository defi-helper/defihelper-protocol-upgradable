const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');

describe('StoreV1.changeStorage', function () {
  let store;
  const storageAddress = '0x0000000000000000000000000000000000000001';
  const newStorageAddress = '0x0000000000000000000000000000000000000002';
  before(async function () {
    const Store = await ethers.getContractFactory('contracts/Store/StoreV1.sol:StoreV1');
    store = await upgrades.deployProxy(Store, [storageAddress], {
      initializer: 'initialize',
    });
    await store.deployed();

    [owner, notOwner] = await ethers.getSigners();
  });

  it('changeStorage: should revert tx if not owner', async function () {
    await assertions.reverts(
      store.connect(notOwner).changeStorage(newStorageAddress),
      'Ownable: caller is not the owner',
    );
  });

  it('changeStorage: should revert tx if for zero address', async function () {
    await assertions.reverts(
      store.changeStorage('0x0000000000000000000000000000000000000000'),
      'Store::changeStorage: invalid storage contract address',
    );
  });

  it('changeStorage: should change storage contract address', async function () {
    strictEqual(await store.info(), storageAddress, 'Invalid start storage address');

    await store.changeStorage(newStorageAddress);

    strictEqual(await store.info(), newStorageAddress, 'Invalid end storage address');
  });
});
