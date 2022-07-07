const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('BuyLiquidity.sellLiquidity', function () {
  let owner, outToken, token0, token1, pair, router, storage, automate;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    [owner] = await ethers.getSigners();

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

    const Storage = await ethers.getContractFactory('Storage');
    storage = await Storage.deploy();
    await storage.deployed();
    await storage.setBool(
      ethers.utils.solidityKeccak256(
        ['string', 'address'],
        ['DFH:Contract:BuyLiquidity:allowedRouter:', router.address],
      ),
      true,
    );

    const Automate = await ethers.getContractFactory('BuyLiquidity');
    automate = await Automate.deploy(storage.address, zeroAddress, zeroAddress);
    await automate.deployed();
  });

  it('sellLiquidity: should remove liquidity and buy token', async function () {
    const liquidity = await pair.balanceOf(owner.address).then((v) => new bn(v.toString()).div(2));
    const token0Amount = new bn(`10e18`);
    const token1Amount = new bn(`10e18`);

    strictEqual(
      await outToken.balanceOf(owner.address).then((v) => v.toString()),
      '0',
      'Invalid start out token balance',
    );

    await pair.approve(automate.address, liquidity.toFixed(0));
    await automate.sellLiquidity(
      liquidity.toFixed(0),
      router.address,
      { path: [token0.address, outToken.address], outMin: token0Amount.toString(10) },
      { path: [token1.address, outToken.address], outMin: token1Amount.toString(10) },
      pair.address,
      0,
    );

    strictEqual(
      await outToken.balanceOf(owner.address).then((v) => v.toString()),
      new bn('20e18').toString(10),
      'Invalid end token balance',
    );
  });

  it('sellLiquidity: should revert tx if router not allowed', async function () {
    await assertions.reverts(
      automate.sellLiquidity('0', zeroAddress, { path: [], outMin: 0 }, { path: [], outMin: 0 }, pair.address, 0),
      'BuyLiquidity::sellLiquidity: invalid router address',
    );
  });

  it('sellLiquidity: should revert tx if last swap0 token not equals last swap1 token', async function () {
    await assertions.reverts(
      automate.sellLiquidity(
        '0',
        router.address,
        { path: [token0.address], outMin: 0 },
        { path: [token1.address], outMin: 0 },
        pair.address,
        0,
      ),
      'BuyLiquidity::sellLiqudity: end token not equals',
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
      ),
      'BuyLiquidity::sellLiqudity: invalid token0',
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
      ),
      'BuyLiquidity::sellLiqudity: invalid token1',
    );
  });
});
