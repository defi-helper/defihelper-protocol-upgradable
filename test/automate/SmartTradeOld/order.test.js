const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('SmartTrade.order', function () {
  let automate;
  let owner, notOwner;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  const routerAddress = '0x0000000000000000000000000000000000000001';
  before(async function () {
    const Automate = await ethers.getContractFactory('SmartTrade');
    automate = await Automate.deploy(zeroAddress);
    await automate.deployed();

    [owner, notOwner] = await ethers.getSigners();
  });

  it('createOrder: should create order', async function () {
    const amountIn = '10';
    const path = ['0x0000000000000000000000000000000000000002', '0x0000000000000000000000000000000000000003'];
    const takeProfit = { amountOut: '15', amountOutMin: '13', throttle: '5', throttleBlock: '0' };
    const stopLoss = { amountOut: '5', amountOutMin: '3', throttle: '5', throttleBlock: '0' };

    strictEqual(await automate.ordersCount().then((v) => v.toString()), '0', 'Invalid start orders count');

    await automate.createOrder(amountIn, routerAddress, path, takeProfit, stopLoss);

    strictEqual(await automate.ordersCount().then((v) => v.toString()), '1', 'Invalid end orders count');
    strictEqual(await automate.isActive('0'), true, 'Invalid new order active status');
    const order = await automate.orders('0');
    strictEqual(order.id.toString(), '0', 'Invalid order id');
    strictEqual(order.customer, owner.address, 'Invalid order customer');
    strictEqual(order.amountIn.toString(), amountIn, 'Invalid order amount in');
    strictEqual(order.router, routerAddress, 'Invalid order router');
    strictEqual(order.takeProfit.amountOut.toString(), takeProfit.amountOut, 'Invalid order take profit amount out');
    strictEqual(
      order.takeProfit.amountOutMin.toString(),
      takeProfit.amountOutMin,
      'Invalid order take profit amount out min',
    );
    strictEqual(order.takeProfit.throttle.toString(), takeProfit.throttle, 'Invalid order take profit throttle');
    strictEqual(order.stopLoss.amountOut.toString(), stopLoss.amountOut, 'Invalid order stop loss amount out');
    strictEqual(
      order.stopLoss.amountOutMin.toString(),
      stopLoss.amountOutMin,
      'Invalid order stop loss amount out min',
    );
    strictEqual(order.stopLoss.throttle.toString(), stopLoss.throttle, 'Invalid order stop loss throttle');
    strictEqual(
      JSON.stringify(await automate.activeOrders().then((v) => v.map((v) => v.toString()))),
      '["0"]',
      'Invalid active orders list',
    );
  });

  it('createOrder: should revert tx if not owner called', async function () {
    await assertions.reverts(
      automate.connect(notOwner).cancelOrder('0'),
      'SmartTrade::cancelOrder: only owner can cancel this order',
    );
  });

  it('cancelOrder: should cancel order', async function () {
    await automate.cancelOrder('0');
    strictEqual(await automate.isActive('0'), false, 'Order not canceled');
    strictEqual(
      JSON.stringify(await automate.activeOrders().then((v) => v.map((v) => v.toString()))),
      '[]',
      'Invalid active orders list',
    );
  });

  it('createOrder: should revert tx if order already canceled', async function () {
    await assertions.reverts(automate.cancelOrder('0'), 'SmartTrade::cancelOrder: order already completed');
  });

  it('createOrder: should revert tx if order not found', async function () {
    await assertions.reverts(automate.cancelOrder('1'), 'SmartTrade::cancelOrder: invalid order id');
  });

  it('createOrder: should revert tx if invalid amount', async function () {
    await assertions.reverts(
      automate.createOrder(
        0,
        routerAddress,
        [],
        { amountOut: 0, amountOutMin: 0, throttle: 0, throttleBlock: 0 },
        { amountOut: 0, amountOutMin: 0, throttle: 0, throttleBlock: 0 },
      ),
      'SmartTrader::createOrder: invalid amount in',
    );
  });

  it('createOrder: should revert tx if invalid router', async function () {
    await assertions.reverts(
      automate.createOrder(
        1,
        zeroAddress,
        [],
        { amountOut: 0, amountOutMin: 0, throttle: 0, throttleBlock: 0 },
        { amountOut: 0, amountOutMin: 0, throttle: 0, throttleBlock: 0 },
      ),
      'SmartTrader::createOrder: invalid router',
    );
  });

  it('createOrder: should revert tx if invalid path', async function () {
    await assertions.reverts(
      automate.createOrder(
        1,
        routerAddress,
        [],
        { amountOut: 0, amountOutMin: 0, throttle: 0, throttleBlock: 0 },
        { amountOut: 0, amountOutMin: 0, throttle: 0, throttleBlock: 0 },
      ),
      'SmartTrader::createOrder: invalid path',
    );
  });

  it('createOrder: should revert tx if empty order', async function () {
    await assertions.reverts(
      automate.createOrder(
        1,
        routerAddress,
        [zeroAddress, zeroAddress],
        { amountOut: 0, amountOutMin: 0, throttle: 0, throttleBlock: 0 },
        { amountOut: 0, amountOutMin: 0, throttle: 0, throttleBlock: 0 },
      ),
      'SmartTrader::createOrder: empty order',
    );
  });
});
