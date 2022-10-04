const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('LPTokensManager.sellLiquidity', function () {
  let owner, treasury, outToken, token0, token1, pair, router, storage, priceFeed, weth, automate;
  const fee = new bn('1e8').toFixed(0);
  const nativeTokenUSD = new bn('1000e8').toFixed(0);
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    [owner] = await ethers.getSigners();

    const Treasury = await ethers.getContractFactory('contracts/Treasury/TreasuryV2.sol:TreasuryV2');
    treasury = await upgrades.deployProxy(Treasury);
    await treasury.deployed();

    const OutToken = await ethers.getContractFactory('ERC20Mock');
    outToken = await OutToken.deploy('OutToken', 'OT', new bn('200e18').toString(10));
    await outToken.deployed();

    const Token0 = await ethers.getContractFactory('ERC20Mock');
    token0 = await Token0.deploy('Token0', 'T0', new bn('100e18').toString(10));
    await token0.deployed();

    const Token1 = await ethers.getContractFactory('ERC20Mock');
    token1 = await Token1.deploy('Token1', 'T1', new bn('100e18').toString(10));
    await token1.deployed();

    const Pair = await ethers.getContractFactory('PairMock');
    pair = await Pair.deploy(token0.address, token1.address);
    await pair.deployed();

    const Router = await ethers.getContractFactory('RouterMock');
    router = await Router.deploy(pair.address);
    await router.deployed();
    await outToken.transfer(router.address, await outToken.balanceOf(owner.address).then((v) => v.toString()));
    await token0.transfer(router.address, await token0.balanceOf(owner.address).then((v) => v.toString()));
    await token1.transfer(router.address, await token1.balanceOf(owner.address).then((v) => v.toString()));

    const PriceFeed = await ethers.getContractFactory('PriceFeedMock');
    priceFeed = await PriceFeed.deploy(8, '', 1);
    await priceFeed.deployed();
    await priceFeed.addRoundData(nativeTokenUSD);

    const WrapMock = await ethers.getContractFactory('WrapMock');
    weth = await WrapMock.deploy('WETH', 'Wrapped ETH');
    await weth.deployed();

    const Storage = await ethers.getContractFactory('Storage');
    storage = await Storage.deploy();
    await storage.deployed();
    await storage.setBool(
      ethers.utils.solidityKeccak256(
        ['string', 'address'],
        ['DFH:Contract:LPTokensManager:allowedRouter:', router.address],
      ),
      true,
    );
    await storage.setAddress(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DFH:Contract:Treasury')),
      treasury.address,
    );
    await storage.setAddress(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DFH:Fee:PriceFeed')), priceFeed.address);
    await storage.setAddress(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('NativeWrapper:Contract')), weth.address);
    await storage.setUint(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DFH:Fee:Automate:LPTokensManager')), fee);

    const Automate = await ethers.getContractFactory('LPTokensManager');
    automate = await Automate.deploy(storage.address);
    await automate.deployed();
  });

  it('sellLiquidity: should remove liquidity and buy token', async function () {
    const liquidity = await pair.balanceOf(owner.address).then((v) => new bn(v.toString()).div(2));
    const token0Amount = new bn('10e18');
    const token1Amount = new bn('10e18');

    strictEqual(
      await outToken.balanceOf(owner.address).then((v) => v.toString()),
      '0',
      'Invalid start out token balance',
    );

    await pair.approve(automate.address, liquidity.toFixed(0));
    const startTreasuryBalance = await ethers.provider.getBalance(treasury.address).then((v) => new bn(v.toString()));
    const startCallerBalance = await ethers.provider.getBalance(owner.address).then((v) => new bn(v.toString()));
    const payFee = await automate.fee().then((v) => new bn(v.toString()));
    await automate.sellLiquidity(
      liquidity.toFixed(0),
      router.address,
      { path: [token0.address, outToken.address], outMin: token0Amount.toString(10) },
      { path: [token1.address, outToken.address], outMin: token1Amount.toString(10) },
      pair.address,
      0,
      {
        gasPrice: 0,
        value: payFee.toFixed(0),
      },
    );

    strictEqual(
      await outToken.balanceOf(owner.address).then((v) => v.toString()),
      new bn('20e18').toString(10),
      'Invalid end token balance',
    );
    strictEqual(
      await ethers.provider.getBalance(owner.address).then((v) => v.toString()),
      startCallerBalance.minus(payFee).toFixed(0),
      'Invalid end caller balance',
    );
    strictEqual(
      await ethers.provider.getBalance(treasury.address).then((v) => v.toString()),
      startTreasuryBalance.plus(payFee).toFixed(0),
      'Invalid end treasury balance',
    );
  });

  it('sellLiquidity: should revert tx if router not allowed', async function () {
    const liquidity = new bn(`1e18`);
    const token0Amount = new bn('10e18');
    const token1Amount = new bn('10e18');
    await pair.approve(automate.address, liquidity.toFixed(0));
    const payFee = await automate.fee().then((v) => new bn(v.toString()));
    await assertions.reverts(
      automate.sellLiquidity(
        liquidity.toFixed(0),
        zeroAddress,
        { path: [token0.address, outToken.address], outMin: token0Amount.toString(10) },
        { path: [token1.address, outToken.address], outMin: token1Amount.toString(10) },
        pair.address,
        0,

        {
          gasPrice: 0,
          value: payFee.toFixed(0),
        },
      ),
      'LPTokensManager::sellLiquidity: invalid router address',
    );
  });

  it('sellLiquidity: should revert tx if last swap0 token not equals last swap1 token', async function () {
    const payFee = await automate.fee().then((v) => new bn(v.toString()));
    await assertions.reverts(
      automate.sellLiquidity(
        '0',
        router.address,
        { path: [token0.address], outMin: 0 },
        { path: [token1.address], outMin: 0 },
        pair.address,
        0,
        {
          gasPrice: 0,
          value: payFee.toFixed(0),
        },
      ),
      'LPTokensManager::sellLiqudity: end token not equals',
    );
  });

  it('sellLiquidity: should revert tx if first swap0 token not equals pair token0', async function () {
    await assertions.reverts(
      automate.sellLiquidity(
        '0',
        router.address,
        { path: [outToken.address, outToken.address], outMin: 0 },
        { path: [token1.address, outToken.address], outMin: 0 },
        pair.address,
        0,
        {
          value: await automate.fee().then((v) => v.toString()),
        },
      ),
      'LPTokensManager::sellLiqudity: invalid token0',
    );
  });

  it('sellLiquidity: should revert tx if first swap1 token not equals pair token1', async function () {
    await assertions.reverts(
      automate.sellLiquidity(
        '0',
        router.address,
        { path: [token0.address, outToken.address], outMin: 0 },
        { path: [outToken.address, outToken.address], outMin: 0 },
        pair.address,
        0,
        {
          value: await automate.fee().then((v) => v.toString()),
        },
      ),
      'LPTokensManager::sellLiqudity: invalid token1',
    );
  });

  it('sellLiquidity: should revert tx if insufficient funds to pay commission', async function () {
    await assertions.fails(
      automate.sellLiquidity(
        await pair.balanceOf(owner.address).then((v) => new bn(v.toString()).div(2).toFixed(0)),
        router.address,
        { path: [token0.address, outToken.address], outMin: new bn('10e18').toFixed(0) },
        { path: [token1.address, outToken.address], outMin: new bn('10e18').toFixed(0) },
        pair.address,
        0,
        {
          gasPrice: 0,
          value: await automate.fee().then((v) => new bn(v.toString()).minus(1).toFixed(0)),
        },
      ),
      'insufficient funds for intrinsic transaction cost',
    );
  });

  it('sellLiquidity: should revert tx if invalid treasury contract address', async function () {
    await storage.setAddress(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DFH:Contract:Treasury')), zeroAddress);
    await assertions.reverts(
      automate.sellLiquidity(
        await pair.balanceOf(owner.address).then((v) => new bn(v.toString()).div(2).toFixed(0)),
        router.address,
        { path: [token0.address, outToken.address], outMin: new bn('10e18').toFixed(0) },
        { path: [token1.address, outToken.address], outMin: new bn('10e18').toFixed(0) },
        pair.address,
        0,
        {
          gasPrice: 0,
          value: await automate.fee().then((v) => v.toString()),
        },
      ),
      'LPTokensManager::_payCommission: invalid treasury contract address',
    );
  });
});
