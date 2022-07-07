const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');

describe('Store.priceFeed', function () {
  let store;
  let priceFeed;
  let account, other;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    const PriceFeed = await ethers.getContractFactory('PriceFeedMock');
    priceFeed = await PriceFeed.deploy(8, 'T', 3);
    await priceFeed.deployed();
    const Store = await ethers.getContractFactory('Store');
    store = await Store.deploy(zeroAddress, priceFeed.address);
    await store.deployed();

    [account, other] = await ethers.getSigners();
  });

  it('priceFeed: should return current price feed', async function () {
    strictEqual(await store.priceFeed(), priceFeed.address, 'Invalid price feed');
  });

  it('changePriceFeed: should change price feed', async function () {
    await store.changePriceFeed(other.address);

    strictEqual(await store.priceFeed(), other.address, 'Invalid price feed');
  });

  it('changePriceFeed: should revert tx if not owner call', async function () {
    await assertions.reverts(
      store.connect(other).changePriceFeed(priceFeed.address),
      'Ownable: caller is not the owner',
    );
  });
});
