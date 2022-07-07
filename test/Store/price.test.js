const { strictEqual } = require('assert');
const { ethers } = require('hardhat');

describe('Store.price', function () {
  let store, priceFeed;
  let account, other;
  const product = { id: 1, priceUSD: 100e8 };
  const ethUSD = 50e8;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    const PriceFeed = await ethers.getContractFactory('PriceFeedMock');
    priceFeed = await PriceFeed.deploy(8, 'T', 3);
    await priceFeed.deployed();
    const Store = await ethers.getContractFactory('Store');
    store = await Store.deploy(zeroAddress, priceFeed.address);
    await store.deployed();

    [account, other] = await ethers.getSigners();
    await store.changeProduct(product.id, product.priceUSD);
    await priceFeed.addRoundData(ethUSD);
  });

  it('price: should return current price of product', async function () {
    strictEqual((await store.price(product.id)).toString(), (2e18).toString(), 'Invalid price');
  });

  it('price: should use price feed', async function () {
    const newEthUSD = 25e8;
    await priceFeed.addRoundData(newEthUSD);

    strictEqual((await store.price(product.id)).toString(), (4e18).toString(), 'Invalid price');
  });
});
