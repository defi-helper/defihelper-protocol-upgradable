const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers, upgrades } = require('hardhat');
const bn = require('bignumber.js');

describe('StoreV3.product', function () {
  let store, storage, priceFeed;
  let account, other;
  const nativeTokenUSD = new bn('1000e8').toFixed(0);
  const product = { id: 1, priceUSD: 100e8 };
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

  it('changeProduct: should set product price USD', async function () {
    const newProduct = { id: 2, priceUSD: 5e8 };

    await store.changeProduct(newProduct.id, newProduct.priceUSD);

    strictEqual(
      await store.products(product.id).then((v) => v.toString()),
      product.priceUSD.toString(),
      'Invalid first product price USD',
    );
    strictEqual(
      await store.products(newProduct.id).then((v) => v.toString()),
      newProduct.priceUSD.toString(),
      'Invalid last product price USD',
    );
  });

  it('changeProduct: should change product price USD', async function () {
    const changedProduct = { id: product.id, priceUSD: new bn(product.priceUSD).multipliedBy(2).toFixed(0) };

    await store.changeProduct(changedProduct.id, changedProduct.priceUSD);

    strictEqual(
      await store.products(product.id).then((v) => v.toString()),
      changedProduct.priceUSD.toString(),
      'Invalid product price USD',
    );
  });

  it('changeProduct: should revert tx if not owner call', async function () {
    await assertions.reverts(store.connect(other).changeProduct(product.id, 0), 'Ownable: caller is not the owner');
  });
});
