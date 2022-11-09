const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('Router.handleOrder', function () {
  let owner, consumer, other, inToken, outToken, balance, priceFeed, storage, handler, router;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  const amountOut = '50';
  const fee = new bn('1e8').toFixed(0);
  const nativeTokenUSD = new bn('1000e8').toFixed(0);
  before(async function () {
    [owner, consumer, other] = await ethers.getSigners();

    const InToken = await ethers.getContractFactory('ERC20Mock');
    inToken = await InToken.deploy('InToken', 'IT', new bn('10e18').toString(10));
    await inToken.deployed();

    const OutToken = await ethers.getContractFactory('ERC20Mock');
    outToken = await OutToken.deploy('OutToken', 'OT', new bn('10e18').toString(10));
    await outToken.deployed();

    const Balance = await ethers.getContractFactory('Balance');
    balance = await Balance.deploy(zeroAddress);
    await balance.deployed();
    await balance.addConsumer(consumer.address);

    const Storage = await ethers.getContractFactory('Storage');
    storage = await Storage.deploy();
    await storage.deployed();

    const PriceFeed = await ethers.getContractFactory('PriceFeedMock');
    priceFeed = await PriceFeed.deploy(8, '', 1);
    await priceFeed.deployed();
    await priceFeed.addRoundData(nativeTokenUSD);

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
    await storage.setUint(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DFH:Fee:Automate:SmartTrade')), fee);
    await storage.setAddress(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DFH:Fee:PriceFeed')), priceFeed.address);
  });

  it('handleOrder: should revert tx if order not found', async function () {
    await assertions.reverts(
      router.handleOrder(await router.ordersCount().then((v) => new bn(v.toString()).plus(1).toString()), '0x', 0),
      'Router::handleOrder: undefined order',
    );
  });

  it('handleOrder: should handle order', async function () {
    const outTokenAccountBalance = await router.balanceOf(owner.address, outToken.address).then((v) => v.toString());
    const amountIn = '100';
    await outToken.transfer(handler.address, amountOut);
    const callData = await handler.callDataEncode({
      tokenIn: inToken.address,
      tokenOut: outToken.address,
      amountIn: amountIn,
      amountOut: amountOut,
    });
    await inToken.approve(router.address, amountIn);
    await router.createOrder(handler.address, callData, [inToken.address], [amountIn]);
    const orderId = await router.ordersCount().then((v) => v.toString());
    const order = await router.order(orderId);
    const inTokenAccountBalance = await router.balanceOf(orderId, inToken.address).then((v) => v.toString());

    await router.handleOrder(order.id.toString(), '0x', 0);
    const successedOrder = await router.order(order.id.toString());

    strictEqual(successedOrder.status.toString(), '1', 'Invalid order status');
    strictEqual(
      await router.balanceOf(orderId, inToken.address).then((v) => v.toString()),
      new bn(inTokenAccountBalance).minus(amountIn).toString(),
      'Invalid in token balance',
    );
    strictEqual(
      await router.balanceOf(orderId, outToken.address).then((v) => v.toString()),
      new bn(outTokenAccountBalance).plus(amountOut).toString(),
      'Invalid out token balance',
    );
  });

  it('handleOrder: should revert tx if order already processed', async function () {
    await assertions.reverts(
      router.handleOrder(await router.ordersCount().then((v) => v.toString()), '0x', 0),
      'Router::handleOrder: order has already been processed',
    );
  });

  it('handleOrder: should claim fees if calles is not order owner', async function () {
    const amountIn = '100';
    await balance.deposit(owner.address, {
      value: new bn(fee).multipliedBy(nativeTokenUSD).toFixed(0),
    });
    await outToken.transfer(handler.address, amountOut);
    const callData = await handler.callDataEncode({
      tokenIn: inToken.address,
      tokenOut: outToken.address,
      amountIn: amountIn,
      amountOut: amountOut,
    });
    await inToken.approve(router.address, amountIn);
    await router.createOrder(handler.address, callData, [inToken.address], [amountIn]);
    const order = await router.order(await router.ordersCount().then((v) => v.toString()));
    const accountClaim = await balance.claimOf(owner.address).then((v) => v.toString());

    const expectedFee = await router.fee().then((v) => v.toString());
    await router.connect(consumer).handleOrder(order.id.toString(), '0x', 0);
    strictEqual(
      await balance.claimOf(owner.address).then((v) => v.toString()),
      new bn(accountClaim).plus(expectedFee).toString(),
      'Invalid balance claim',
    );
  });

  it('handleOrder: should revert tx if caller is not owner and consumer', async function () {
    await router.createOrder(
      handler.address,
      await handler.callDataEncode({
        tokenIn: inToken.address,
        tokenOut: outToken.address,
        amountIn: '100',
        amountOut: amountOut,
      }),
      [],
      [],
    );

    await assertions.reverts(
      router.connect(other).handleOrder(await router.ordersCount().then((v) => v.toString()), '0x', 0),
      'Balance: caller is not a consumer',
    );
  });

  it('handleOrder: should revert tx if invalid balance address', async function () {
    await router.createOrder(
      handler.address,
      await handler.callDataEncode({
        tokenIn: inToken.address,
        tokenOut: outToken.address,
        amountIn: '100',
        amountOut: amountOut,
      }),
      [],
      [],
    );
    await storage.setAddress(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DFH:Contract:Balance')), zeroAddress);

    await assertions.reverts(
      router.connect(consumer).handleOrder(await router.ordersCount().then((v) => v.toString()), '0x', 0),
      'Router::handleOrder: invalid balance contract address',
    );
  });
});
