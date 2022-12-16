const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers, upgrades } = require('hardhat');
const bn = require('bignumber.js');

describe('StoreV3.price', function () {
  let store, storage, priceFeed;
  let account, other;
  const product = { id: 1, priceUSD: 100e8 };
  const nativeTokenUSD = new bn('1000e8').toFixed(0);
  before(async function () {
    [account, other] = await ethers.getSigners();

    const PriceFeed = await ethers.getContractFactory('PriceFeedMock');
    priceFeed = await PriceFeed.deploy(8, '', 1);
    await priceFeed.deployed();
    await priceFeed.addRoundData(nativeTokenUSD);

    const Storage = await ethers.getContractFactory('Storage');
    storage = await Storage.deploy();
    await storage.deployed();
    await storage.setAddress(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DFH:Fee:PriceFeed')), priceFeed.address);

    const Store = await ethers.getContractFactory('contracts/Store/StoreV3.sol:StoreV3');
    store = await upgrades.deployProxy(Store, [storage.address], {
      initializer: 'initialize',
    });
    await store.deployed();
    await store.changeProduct(product.id, product.priceUSD);
  });

  it('price: should return current price of product', async function () {
    strictEqual(
      await store.price(product.id).then((v) => v.toString()),
      new bn(product.priceUSD).multipliedBy('1e18').div(nativeTokenUSD).toFixed(0),
      'Invalid price',
    );
  });

  it('price: should use price feed', async function () {
    const newNativeTokenUSD = new bn(nativeTokenUSD).div(2).toFixed(0);
    await priceFeed.addRoundData(newNativeTokenUSD);

    strictEqual(
      await store.price(product.id).then((v) => v.toString()),
      new bn(product.priceUSD).multipliedBy('1e18').div(newNativeTokenUSD).toFixed(0),
      'Invalid price',
    );
  });

  it('price: should revert tx if invalid price feed response', async function () {
    await priceFeed.addRoundData(0);
    await assertions.reverts(store.price(product.id), 'Store::price: invalid price feed response');
  });
});
