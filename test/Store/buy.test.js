const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');

describe('Store.price', function () {
  let store, balance, priceFeed;
  let account;
  const product = { id: 1, priceUSD: 100e8 };
  const ethUSD = 50e8;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    const Balance = await ethers.getContractFactory('Balance');
    balance = await Balance.deploy(zeroAddress);
    await balance.deployed();
    const PriceFeed = await ethers.getContractFactory('PriceFeedMock');
    priceFeed = await PriceFeed.deploy(8, 'T', 3);
    await priceFeed.deployed();
    const Store = await ethers.getContractFactory('Store');
    store = await Store.deploy(balance.address, priceFeed.address);
    await store.deployed();

    [account] = await ethers.getSigners();
    await store.changeProduct(product.id, product.priceUSD);
    await priceFeed.addRoundData(ethUSD);
    await balance.deposit(account.address, {
      value: ethers.utils.parseEther('2'),
    });
  });

  it('buy: should buy product', async function () {
    const price = await store.price(product.id);

    const tx = await store.buy(product.id, account.address, price.toString(), Math.floor(Date.now() / 1000) + 10000);
    const [buyEvent] = await store.queryFilter(store.filters.Buy(), tx.blockNumber);
    strictEqual(buyEvent.args.product, product.id, 'Invalid product id');
    strictEqual(buyEvent.args.recipient, account.address, 'Invalid recipient');
    const claim = await balance.claimOf(account.address);
    strictEqual(claim.toString(), (2e18).toString(), 'Invalid claim amount');
  });

  it('buy: should revert tx if expired', async function () {
    await assertions.reverts(
      store.buy(product.id, account.address, 0, Math.floor(Date.now() / 1000) - 100),
      'Store: expired',
    );
  });

  it('buy: should revert tx if amount zero', async function () {
    await assertions.reverts(
      store.buy(product.id + 1, account.address, 0, Math.floor(Date.now() / 1000) + 10000),
      'Store: negative or zero price',
    );
  });

  it('buy: should revert tx if excessive price', async function () {
    await assertions.reverts(
      store.buy(product.id, account.address, ethers.utils.parseEther('1'), Math.floor(Date.now() / 1000) + 10000),
      'Store: excessive price',
    );
  });
});
