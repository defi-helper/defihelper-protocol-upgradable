const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');

describe('BuyLiquidity.changeStorage', function () {
  let buyLiquidity;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  const storageAddress = '0x0000000000000000000000000000000000000001';
  const newStorageAddress = '0x0000000000000000000000000000000000000002';
  before(async function () {
    const BuyLiquidity = await ethers.getContractFactory('BuyLiquidity');
    buyLiquidity = await BuyLiquidity.deploy(storageAddress, zeroAddress, zeroAddress);
    await buyLiquidity.deployed();

    [owner, notOwner] = await ethers.getSigners();
  });

  it('changeStorage: should revert tx if not owner', async function () {
    await assertions.reverts(
      buyLiquidity.connect(notOwner).changeStorage(newStorageAddress),
      'Ownable: caller is not the owner',
    );
  });

  it('changeStorage: should change storage contract address', async function () {
    strictEqual(await buyLiquidity.info(), storageAddress, 'Invalid start storage address');

    await buyLiquidity.connect(owner).changeStorage(newStorageAddress);

    strictEqual(await buyLiquidity.info(), newStorageAddress, 'Invalid end storage address');
  });
});
