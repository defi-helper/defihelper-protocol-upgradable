const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('Router.cancelOrder', function () {
  let owner, other, inToken, outToken, balance, storage, handler, router, order;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    [owner, other] = await ethers.getSigners();

    const InToken = await ethers.getContractFactory('ERC20Mock');
    inToken = await InToken.deploy('InToken', 'IT', new bn('10e18').toString(10));
    await inToken.deployed();

    const OutToken = await ethers.getContractFactory('ERC20Mock');
    outToken = await OutToken.deploy('OutToken', 'OT', new bn('10e18').toString(10));
    await outToken.deployed();

    const Balance = await ethers.getContractFactory('Balance');
    balance = await Balance.deploy(zeroAddress);
    await balance.deployed();

    const Storage = await ethers.getContractFactory('Storage');
    storage = await Storage.deploy();
    await storage.deployed();

    const Router = await ethers.getContractFactory('contracts/automate/SmartTrade/Router.sol:SmartTradeRouter');
    router = await Router.deploy(storage.address);
    await router.deployed();

    const Handler = await ethers.getContractFactory(
      'contracts/automate/SmartTrade/mock/HandlerMock.sol:SmartTradeHandlerMock',
    );
    handler = await Handler.deploy(router.address);
    await handler.deployed();

    await storage.setBool(
      ethers.utils.solidityKeccak256(
        ['string', 'address'],
        ['DFH:Contract:SmartTrade:allowedHandler:', handler.address],
      ),
      true,
    );
    await storage.setAddress(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DFH:Contract:Balance')), balance.address);

    const inTokenAmount = '10';
    await inToken.approve(router.address, inTokenAmount);
    await router.createOrder(
      handler.address,
      await handler.callDataEncode({
        tokenIn: inToken.address,
        tokenOut: outToken.address,
        amountIn: inTokenAmount,
        amountOut: '5',
      }),
      [inToken.address],
      [inTokenAmount],
    );
    order = await router.order(router.ordersCount().then((v) => v.toString()));
  });

  it('cancelOrder: should revert tx if order not exists', async function () {
    await assertions.reverts(
      router.cancelOrder(await router.ordersCount().then((v) => new bn(v.toString()).plus(1).toString()), []),
      'Router::cancelOrder: undefined order',
    );
  });

  it('cancelOrder: should revert tx if caller is not order owner', async function () {
    await assertions.reverts(
      router.connect(other).cancelOrder(order.id.toString(), []),
      'Router::cancelOrder: forbidden',
    );
  });

  it('cancelOrder: should cancel order', async function () {
    strictEqual(order.status.toString(), '0', 'Invalid order status');

    await router.cancelOrder(order.id.toString(), [inToken.address]);
    const canceledOrder = await router.order(order.id.toString());

    strictEqual(canceledOrder.status.toString(), '2', 'Invalid order status');
  });

  it('cancelOrder: should revert tx if order already processed', async function () {
    await assertions.reverts(
      router.cancelOrder(order.id.toString(), []),
      'Router::cancelOrder: order has already been processed',
    );
  });

  it('cancelOrder: should cancel order if caller is router owner', async function () {
    await router.connect(other).createOrder(
      handler.address,
      await handler.callDataEncode({
        tokenIn: inToken.address,
        tokenOut: outToken.address,
        amountIn: '10',
        amountOut: '5',
      }),
      [],
      [],
    );
    const otherOrder = await router.order(router.ordersCount().then((v) => v.toString()));

    await router.connect(owner).cancelOrder(otherOrder.id.toString(), []);
    const canceledOrder = await router.order(otherOrder.id.toString());

    strictEqual(canceledOrder.status.toString(), '2', 'Invalid order status');
  });
});
