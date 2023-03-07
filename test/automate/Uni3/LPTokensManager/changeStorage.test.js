const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');

describe('Uni3/LPTokensManager.changeStorage', function () {
  let automate;
  const storageAddress = '0x0000000000000000000000000000000000000001';
  const newStorageAddress = '0x0000000000000000000000000000000000000002';
  before(async function () {
    const Automate = await ethers.getContractFactory('contracts/automate/Uni3/LPTokensManager.sol:LPTokensManager');
    automate = await Automate.deploy(storageAddress);
    await automate.deployed();

    [owner, notOwner] = await ethers.getSigners();
  });

  it('changeStorage: should revert tx if not owner', async function () {
    await assertions.reverts(
      automate.connect(notOwner).changeStorage(newStorageAddress),
      'Ownable: caller is not the owner',
    );
  });

  it('changeStorage: should revert tx if for zero address', async function () {
    await assertions.reverts(
      automate.changeStorage('0x0000000000000000000000000000000000000000'),
      'LPTokensManager::changeStorage: invalid storage contract address',
    );
  });

  it('changeStorage: should change storage contract address', async function () {
    strictEqual(await automate.info(), storageAddress, 'Invalid start storage address');

    await automate.connect(owner).changeStorage(newStorageAddress);

    strictEqual(await automate.info(), newStorageAddress, 'Invalid end storage address');
  });
});
