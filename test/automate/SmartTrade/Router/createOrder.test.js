const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('Router.createOrder', function () {
  let owner, inToken, outToken, balance, storage, handler, router;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    [owner] = await ethers.getSigners();

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

  it('createOrder: should create order', async function () {
    const ordersCount = await router.ordersCount().then((v) => v.toString());

    const callData = await handler.callDataEncode({
      tokenIn: inToken.address,
      tokenOut: outToken.address,
      amountIn: '10',
      amountOut: '5',
    });
    await router.createOrder(handler.address, callData, [], []);
    const newOrderId = new bn(ordersCount).plus(1).toString(10);

    const newOrder = await router.order(newOrderId);
    strictEqual(await router.ordersCount().then((v) => v.toString()), newOrderId, 'Invalid orders count');
    strictEqual(newOrder.owner, owner.address, 'Invalid order owner');
    strictEqual(newOrder.status.toString(), '0', 'Invalid order status');
    strictEqual(newOrder.handler, handler.address, 'Invalid order handler');
    strictEqual(newOrder.callData, callData, 'Invalid order call data');
  });

  it('createOrder: should transfer token to router', async function () {
    const tokenBalanceOfAccount = await inToken.balanceOf(owner.address).then((v) => v.toString());
    const routerBalanceOfAccount = await router.balanceOf(owner.address, inToken.address).then((v) => v.toString());
    const tokenBalanceOfRouter = await inToken.balanceOf(router.address).then((v) => v.toString());
    const amountIn = '10';

    await inToken.approve(router.address, amountIn);
    await router.createOrder(
      handler.address,
      await handler.callDataEncode({
        tokenIn: inToken.address,
        tokenOut: outToken.address,
        amountIn,
        amountOut: '5',
      }),
      [inToken.address],
      [amountIn],
    );
    const orderId = await router.ordersCount().then((v) => v.toString());

    strictEqual(
      await inToken.balanceOf(owner.address).then((v) => v.toString()),
      new bn(tokenBalanceOfAccount).minus(amountIn).toFixed(0),
      'Invalid token balance of account',
    );
    strictEqual(
      await router.balanceOf(orderId, inToken.address).then((v) => v.toString()),
      new bn(routerBalanceOfAccount).plus(amountIn).toFixed(0),
      'Invalid router balance of account',
    );
    strictEqual(
      await inToken.balanceOf(router.address).then((v) => v.toString()),
      new bn(tokenBalanceOfRouter).plus(amountIn).toFixed(0),
      'Invalid token balance of router',
    );
  });

  it('createOrder: should transfer native token to balance', async function () {
    const balanceOfAccount = await balance.balanceOf(owner.address).then((v) => v.toString());
    const balanceAmountIn = '10';

    await router.createOrder(
      handler.address,
      await handler.callDataEncode({
        tokenIn: inToken.address,
        tokenOut: outToken.address,
        amountIn: '10',
        amountOut: '5',
      }),
      [],
      [],
      { value: balanceAmountIn },
    );

    strictEqual(
      await balance.balanceOf(owner.address).then((v) => v.toString()),
      new bn(balanceOfAccount).plus(balanceAmountIn).toFixed(0),
      'Invalid balance of account',
    );
  });

  it('createOrder: should revert tx if handler revert callback', async function () {
    const invalidCallData = ethers.utils.defaultAbiCoder.encode(
      ['address', 'address'],
      [inToken.address, outToken.address],
    );
    await assertions.reverts(router.createOrder(handler.address, invalidCallData, [], []), '');
  });

  it('createOrder: should revert tx if invalid handler', async function () {
    await assertions.reverts(
      router.createOrder(
        zeroAddress,
        await handler.callDataEncode({
          tokenIn: inToken.address,
          tokenOut: outToken.address,
          amountIn: '10',
          amountOut: '5',
        }),
        [],
        [],
      ),
      '',
    );
  });

  it('createOrder: should revert tx if native token transferred and balance contract invalid', async function () {
    const balanceAmountIn = '10';
    await storage.setAddress(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DFH:Contract:Balance')), zeroAddress);

    await assertions.reverts(
      router.createOrder(
        handler.address,
        await handler.callDataEncode({
          tokenIn: inToken.address,
          tokenOut: outToken.address,
          amountIn: '10',
          amountOut: '5',
        }),
        [],
        [],
        { value: balanceAmountIn },
      ),
      'Router::createOrder: invalid balance contract address',
    );
  });
});
