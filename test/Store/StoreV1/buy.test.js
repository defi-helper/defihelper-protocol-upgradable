const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers, upgrades } = require('hardhat');
const bn = require('bignumber.js');

describe('Store.buy', function () {
  let store, storage, priceFeed, treasury;
  let account;
  const product = { id: 1, priceUSD: 100e8 };
  const nativeTokenUSD = new bn('1000e8').toFixed(0);
  before(async function () {
    [account, treasury] = await ethers.getSigners();

    const PriceFeed = await ethers.getContractFactory('PriceFeedMock');
    priceFeed = await PriceFeed.deploy(8, '', 1);
    await priceFeed.deployed();
    await priceFeed.addRoundData(nativeTokenUSD);

    const Storage = await ethers.getContractFactory('Storage');
    storage = await Storage.deploy();
    await storage.deployed();
    await storage.setAddress(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DFH:Contract:Treasury')),
      treasury.address,
    );
    await storage.setAddress(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DFH:Fee:PriceFeed')), priceFeed.address);

    const Store = await ethers.getContractFactory('contracts/Store/StoreV1.sol:StoreV1');
    store = await upgrades.deployProxy(Store, [storage.address], {
      initializer: 'initialize',
    });
    await store.deployed();
    await store.changeProduct(product.id, product.priceUSD);
  });

  it('buy: should buy product', async function () {
    const startTreasuryBalance = await ethers.provider.getBalance(treasury.address).then((v) => v.toString());
    const startRecipientBalance = await ethers.provider.getBalance(account.address).then((v) => v.toString());
    const price = await store.price(product.id).then((v) => v.toString());
    const maxPrice = new bn(price).multipliedBy(1.05).toFixed(0);

    const tx = await store.buy(product.id, account.address, maxPrice, Math.floor(Date.now() / 1000) + 10000, {
      value: new bn(price).multipliedBy(2).toFixed(0),
      gasPrice: 0,
    });

    strictEqual(
      await ethers.provider.getBalance(treasury.address).then((v) => v.toString()),
      new bn(startTreasuryBalance).plus(price).toFixed(0),
      'Invalid end treasury balance',
    );
    strictEqual(
      await ethers.provider.getBalance(account.address).then((v) => v.toString()),
      new bn(startRecipientBalance).minus(price).toFixed(0),
      'Invalid end account balance',
    );
    const [buyEvent] = await store.queryFilter(store.filters.Buy(), tx.blockNumber);
    strictEqual(buyEvent.args.product, product.id, 'Invalid product id');
    strictEqual(buyEvent.args.recipient, account.address, 'Invalid recipient');
  });

  it('buy: should revert tx if undefined product', async function () {
    await assertions.reverts(
      store.buy(product.id + 1, account.address, 0, Math.floor(Date.now() / 1000) + 10000),
      'Store::buy: undefined product',
    );
  });

  it('buy: should revert tx if expired', async function () {
    await assertions.reverts(
      store.buy(product.id, account.address, 0, Math.floor(Date.now() / 1000) - 100),
      'Store::buy: expired',
    );
  });

  it('buy: should revert tx if insufficient funds to pay product price', async function () {
    const price = await store.price(product.id).then((v) => v.toString());

    await assertions.fails(
      store.buy(product.id, account.address, price, Math.floor(Date.now() / 1000) + 10000, {
        value: new bn(price).minus(1).toFixed(0),
      }),
      'insufficient funds for intrinsic transaction cost',
    );
  });

  it('buy: should revert tx if excessive price', async function () {
    await assertions.reverts(
      store.buy(
        product.id,
        account.address,
        await store.price(product.id).then((v) => new bn(v.toString()).minus('1').toFixed(0)),
        Math.floor(Date.now() / 1000) + 10000,
        {
          value: await store.price(product.id).then((v) => v.toString()),
        },
      ),
      'Store::buy: excessive price',
    );
  });

  it('buy: should revert tx if invalid treasury contract address', async function () {
    await storage.setAddress(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DFH:Contract:Treasury')),
      '0x0000000000000000000000000000000000000000',
    );

    await assertions.reverts(
      store.buy(
        product.id,
        account.address,
        await store.price(product.id).then((v) => v.toString()),
        Math.floor(Date.now() / 1000) + 10000,
        {
          value: await store.price(product.id).then((v) => v.toString()),
        },
      ),
      'Store::buy: invalid treasury contract address',
    );
  });
});
