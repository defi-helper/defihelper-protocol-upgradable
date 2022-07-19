const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');

describe('Store.product', function () {
  let store;
  let account, other;
  const product = { id: 1, priceUSD: 100e8 };
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    const Store = await ethers.getContractFactory('Store');
    store = await Store.deploy(zeroAddress, zeroAddress);
    await store.deployed();

    [account, other] = await ethers.getSigners();
    await store.changeProduct(product.id, product.priceUSD);
  });

  it('changeProduct: should set product price USD', async function () {
    const newProduct = { id: 2, priceUSD: 5e8 };

    await store.changeProduct(newProduct.id, newProduct.priceUSD);

    const firstProduct = await store.products(product.id);
    strictEqual(firstProduct.toString(), product.priceUSD.toString(), 'Invalid first product price USD');
    const lastProduct = await store.products(newProduct.id);
    strictEqual(lastProduct.toString(), newProduct.priceUSD.toString(), 'Invalid last product price USD');
  });

  it('changeProduct: should revert tx if not owner call', async function () {
    await assertions.reverts(store.connect(other).changeProduct(product.id, 0), 'Ownable: caller is not the owner');
  });
});
