const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

const nextBlock = () => ethers.provider.send('evm_mine');

describe('SmartTrade.check', function () {
  let balance, feeToken, tokenIn, tokenOut, pair, router, automate;
  let owner, consumer, notOwner;
  const treasuryAddress = '0x0000000000000000000000000000000000000001';
  before(async function () {
    [owner, consumer, notOwner] = await ethers.getSigners();

    const FeeToken = await ethers.getContractFactory('ERC20Mock');
    feeToken = await FeeToken.deploy('FeeToken', 'FT', new bn('100e18').toString(10));
    await feeToken.deployed();

    const TokenIn = await ethers.getContractFactory('ERC20Mock');
    tokenIn = await TokenIn.deploy('TokenIn', 'IN', new bn('100e18').toString(10));
    await tokenIn.deployed();

    const TokenOut = await ethers.getContractFactory('ERC20Mock');
    tokenOut = await TokenOut.deploy('TokenOut', 'OUT', new bn('100e18').toString(10));
    await tokenOut.deployed();

    const Pair = await ethers.getContractFactory('PairMock');
    pair = await Pair.deploy(tokenIn.address, tokenOut.address);
    await pair.deployed();

    const Router = await ethers.getContractFactory('RouterMock');
    router = await Router.deploy(pair.address);
    await router.deployed();
    await pair.transfer(router.address, await pair.balanceOf(owner.address).then((v) => v.toString()));
    //await tokenIn.transfer(router.address, await tokenIn.balanceOf(owner.address).then((v) => v.toString()));
    await tokenOut.transfer(router.address, await tokenOut.balanceOf(owner.address).then((v) => v.toString()));

    const Balance = await ethers.getContractFactory('ApprovableBalance');
    balance = await Balance.deploy(feeToken.address, treasuryAddress);
    await balance.deployed();
    await balance.addConsumer(consumer.address);

    const Automate = await ethers.getContractFactory('SmartTrade');
    automate = await Automate.deploy(balance.address);
    await automate.deployed();

    await feeToken.approve(balance.address, new bn(2).pow(256).minus(1).toFixed(0));
    await tokenIn.approve(automate.address, new bn(2).pow(256).minus(1).toFixed(0));
  });

  it('check: should skip if the price is below take profit and above stop loss', async function () {
    const amountIn = new bn('1e18');
    const oid = '0';

    await automate.createOrder(
      amountIn.toFixed(0),
      router.address,
      [tokenIn.address, tokenOut.address],
      {
        amountOut: new bn('3e18').toFixed(0),
        amountOutMin: new bn('3e18').toFixed(0),
        throttle: 0,
        throttleBlock: 0
      },
      {
        amountOut: new bn('1e18').toFixed(0),
        amountOutMin: new bn('1e18').toFixed(0),
        throttle: 0,
        throttleBlock: 0
      },
    );
    strictEqual(await automate.ordersCount().then((v) => v.toString()), '1', 'Order not created');
    await router.setPrice(tokenOut.address, new bn('2').toFixed(0));

    const tx = await automate.check(oid, '0', '0', Date.now()).then((tx) => tx.wait());
    strictEqual(tx.events.length, 0, 'Invalid check');
  });

  it('check: should swap if the price is above take profit and throttle not set', async function () {
    const amountIn = new bn('1e18');
    const price = '5';
    const oid = '1';
    const startBalanceIn = await tokenIn.balanceOf(owner.address).then((v) => new bn(v.toString()));
    const startBalanceOut = await tokenOut.balanceOf(owner.address).then((v) => new bn(v.toString()));

    await automate.createOrder(
      amountIn.toFixed(0),
      router.address,
      [tokenIn.address, tokenOut.address],
      {
        amountOut: new bn('3e18').toFixed(0),
        amountOutMin: new bn('3e18').toFixed(0),
        throttle: 0,
        throttleBlock: 0
      },
      {
        amountOut: new bn('1e18').toFixed(0),
        amountOutMin: new bn('1e18').toFixed(0),
        throttle: 0,
        throttleBlock: 0
      },
    );
    strictEqual(await automate.ordersCount().then((v) => v.toString()), '2', 'Order not created');
    await router.setPrice(tokenOut.address, price);

    const tx = await automate.check(oid, '1', '0', Date.now()).then((tx) => tx.wait());
    strictEqual(
      tx.events.some(({ event }) => event === 'OrderCompleted'),
      true,
      'Event not found',
    );
    strictEqual(await automate.isActive(oid), false, 'Order not completed');
    strictEqual(
      await tokenIn.balanceOf(owner.address).then((v) => v.toString()),
      startBalanceIn.minus(amountIn).toFixed(0),
      'Invalid balance tokenIn',
    );
    strictEqual(
      await tokenOut.balanceOf(owner.address).then((v) => v.toString()),
      startBalanceOut.plus(amountIn.multipliedBy(price)).toFixed(0),
      'Invalid balance tokenOut',
    );
  });

  it('check: should swap if the price is below stop loss and throttle not set', async function () {
    const amountIn = new bn('1e18');
    const price = '1';
    const oid = '2';
    const startBalanceIn = await tokenIn.balanceOf(owner.address).then((v) => new bn(v.toString()));
    const startBalanceOut = await tokenOut.balanceOf(owner.address).then((v) => new bn(v.toString()));

    await automate.createOrder(
      amountIn.toFixed(0),
      router.address,
      [tokenIn.address, tokenOut.address],
      {
        amountOut: new bn('3e18').toFixed(0),
        amountOutMin: new bn('3e18').toFixed(0),
        throttle: 0,
        throttleBlock: 0
      },
      {
        amountOut: new bn('1e18').toFixed(0),
        amountOutMin: new bn('1e18').toFixed(0),
        throttle: 0,
        throttleBlock: 0
      },
    );
    strictEqual(await automate.ordersCount().then((v) => v.toString()), '3', 'Order not created');
    await router.setPrice(tokenOut.address, price);

    const tx = await automate.check(oid, '1', '0', Date.now()).then((tx) => tx.wait());
    strictEqual(
      tx.events.some(({ event }) => event === 'OrderCompleted'),
      true,
      'Event not found',
    );
    strictEqual(await automate.isActive(oid), false, 'Order not completed');
    strictEqual(
      await tokenIn.balanceOf(owner.address).then((v) => v.toString()),
      startBalanceIn.minus(amountIn).toFixed(0),
      'Invalid balance tokenIn',
    );
    strictEqual(
      await tokenOut.balanceOf(owner.address).then((v) => v.toString()),
      startBalanceOut.plus(amountIn.multipliedBy(price)).toFixed(0),
      'Invalid balance tokenOut',
    );
  });

  it('check: should swap if the price is above take profit and throttle set', async function () {
    const amountIn = new bn('1e18');
    const price = '5';
    const oid = '3';
    const startBalanceIn = await tokenIn.balanceOf(owner.address).then((v) => new bn(v.toString()));
    const startBalanceOut = await tokenOut.balanceOf(owner.address).then((v) => new bn(v.toString()));

    await automate.createOrder(
      amountIn.toFixed(0),
      router.address,
      [tokenIn.address, tokenOut.address],
      {
        amountOut: new bn('3e18').toFixed(0),
        amountOutMin: new bn('3e18').toFixed(0),
        throttle: 3,
        throttleBlock: 0
      },
      {
        amountOut: new bn('1e18').toFixed(0),
        amountOutMin: new bn('1e18').toFixed(0),
        throttle: 0,
        throttleBlock: 0
      },
    );
    strictEqual(await automate.ordersCount().then((v) => v.toString()), '4', 'Order not created');
    await router.setPrice(tokenOut.address, price);

    await automate.connect(consumer).check(oid, '1', '0', Date.now()).then((tx) => tx.wait());
    strictEqual(await automate.isActive(oid), true, 'Order is completed after throttle set');

    await router.setPrice(tokenOut.address, '1');
    await automate.connect(consumer).check(oid, '1', '0', Date.now()).then((tx) => tx.wait());
    strictEqual(await automate.isActive(oid), true, 'Order is completed after throttle unset');

    await router.setPrice(tokenOut.address, price);
    await automate.connect(consumer).check(oid, '1', '0', Date.now()).then((tx) => tx.wait());
    strictEqual(await automate.isActive(oid), true, 'Order is completed after 1 block');
    await automate.connect(consumer).check(oid, '1', '0', Date.now()).then((tx) => tx.wait());
    strictEqual(await automate.isActive(oid), true, 'Order is completed after 2 block');
    await automate.connect(consumer).check(oid, '1', '0', Date.now()).then((tx) => tx.wait());
    strictEqual(await automate.isActive(oid), true, 'Order is completed after 3 block');

    const tx = await automate.connect(consumer).check(oid, '1', '0', Date.now()).then((tx) => tx.wait());

    strictEqual(
      tx.events.some(({ event }) => event === 'OrderCompleted'),
      true,
      'Event not found',
    );
    strictEqual(await automate.isActive(oid), false, 'Order not completed');
    strictEqual(
      await tokenIn.balanceOf(owner.address).then((v) => v.toString()),
      startBalanceIn.minus(amountIn).toFixed(0),
      'Invalid balance tokenIn',
    );
    strictEqual(
      await tokenOut.balanceOf(owner.address).then((v) => v.toString()),
      startBalanceOut.plus(amountIn.multipliedBy(price)).toFixed(0),
      'Invalid balance tokenOut',
    );
  });

  it('check: should swap if the price is below stop loss and throttle set', async function () {
    const amountIn = new bn('1e18');
    const price = '1';
    const oid = '4';
    const startBalanceIn = await tokenIn.balanceOf(owner.address).then((v) => new bn(v.toString()));
    const startBalanceOut = await tokenOut.balanceOf(owner.address).then((v) => new bn(v.toString()));

    await automate.createOrder(
      amountIn.toFixed(0),
      router.address,
      [tokenIn.address, tokenOut.address],
      {
        amountOut: new bn('5e18').toFixed(0),
        amountOutMin: new bn('5e18').toFixed(0),
        throttle: 0,
        throttleBlock: 0,
      },
      {
        amountOut: new bn('1e18').toFixed(0),
        amountOutMin: new bn('1e18').toFixed(0),
        throttle: 3,
        throttleBlock: 0,
      },
    );
    strictEqual(await automate.ordersCount().then((v) => v.toString()), '5', 'Order not created');
    await router.setPrice(tokenOut.address, price);

    await automate.connect(consumer).check(oid, '1', '0', Date.now()).then((tx) => tx.wait());
    strictEqual(await automate.isActive(oid), true, 'Order is completed after throttle set');

    await router.setPrice(tokenOut.address, '3');
    await automate.connect(consumer).check(oid, '1', '0', Date.now()).then((tx) => tx.wait());
    strictEqual(await automate.isActive(oid), true, 'Order is completed after throttle unset');

    await router.setPrice(tokenOut.address, price);
    await automate.connect(consumer).check(oid, '1', '0', Date.now()).then((tx) => tx.wait());
    strictEqual(await automate.isActive(oid), true, 'Order is completed after 1 block');
    await automate.connect(consumer).check(oid, '1', '0', Date.now()).then((tx) => tx.wait());
    strictEqual(await automate.isActive(oid), true, 'Order is completed after 2 block');
    await automate.connect(consumer).check(oid, '1', '0', Date.now()).then((tx) => tx.wait());
    strictEqual(await automate.isActive(oid), true, 'Order is completed after 3 block');

    const tx = await automate.connect(consumer).check(oid, '1', '0', Date.now()).then((tx) => tx.wait());

    strictEqual(
      tx.events.some(({ event }) => event === 'OrderCompleted'),
      true,
      'Event not found',
    );
    strictEqual(await automate.isActive(oid), false, 'Order not completed');
    strictEqual(
      await tokenIn.balanceOf(owner.address).then((v) => v.toString()),
      startBalanceIn.minus(amountIn).toFixed(0),
      'Invalid balance tokenIn',
    );
    strictEqual(
      await tokenOut.balanceOf(owner.address).then((v) => v.toString()),
      startBalanceOut.plus(amountIn.multipliedBy(price)).toFixed(0),
      'Invalid balance tokenOut',
    );
  });
});
