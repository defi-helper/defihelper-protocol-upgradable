const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('Router.updateOrder', function () {
  let owner, notOwner, inToken, outToken, balance, storage, handler, router;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    [owner, notOwner] = await ethers.getSigners();

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
  });

  it('updateOrder: should update order', async function () {
    const firstState = {
      tokenIn: inToken.address,
      tokenOut: outToken.address,
      amountIn: '10',
      amountOut: '5',
    };
    const secondState = {
      tokenIn: inToken.address,
      tokenOut: outToken.address,
      amountIn: '2',
      amountOut: '4',
    };

    const firstCallData = await handler.callDataEncode(firstState);
    await router.createOrder(handler.address, firstCallData, [], []);
    const orderId = await router.ordersCount().then((v) => v.toString());

    const secondCallData = await handler.callDataEncode(secondState);
    await router.updateOrder(orderId, secondCallData);

    const order = await router.order(orderId);
    strictEqual(order.owner, owner.address, 'Invalid order owner');
    strictEqual(order.status.toString(), '0', 'Invalid order status');
    strictEqual(order.handler, handler.address, 'Invalid order handler');
    strictEqual(order.callData, secondCallData, 'Invalid order call data');
  });

  it('updateOrder: should revert tx if order not found', async function () {
    const state = {
      tokenIn: inToken.address,
      tokenOut: outToken.address,
      amountIn: '10',
      amountOut: '5',
    };

    const undefinedOrderid = await router.ordersCount().then((v) => new bn(v.toString()).plus(1).toString());
    const callData = await handler.callDataEncode(state);
    await assertions.reverts(
      router.updateOrder(undefinedOrderid, callData),
      'SmartTradeRouter::updateOrder: undefined order',
    );
  });

  it('updateOrder: should revert tx if forbidden', async function () {
    const state = {
      tokenIn: inToken.address,
      tokenOut: outToken.address,
      amountIn: '10',
      amountOut: '5',
    };

    const orderId = await router.ordersCount().then((v) => v.toString());
    const callData = await handler.callDataEncode(state);
    await assertions.reverts(
      router.connect(notOwner).updateOrder(orderId, callData),
      'SmartTradeRouter::updateOrder: forbidden',
    );
  });

  it('updateOrder: should revert tx if order has already been processed', async function () {
    const state = {
      tokenIn: inToken.address,
      tokenOut: outToken.address,
      amountIn: '10',
      amountOut: '5',
    };

    const orderId = await router.ordersCount().then((v) => v.toString());
    const callData = await handler.callDataEncode(state);
    await router.cancelOrder(orderId, []);
    await assertions.reverts(
      router.updateOrder(orderId, callData),
      'SmartTradeRouter::updateOrder: order has already been processed',
    );
  });
});
