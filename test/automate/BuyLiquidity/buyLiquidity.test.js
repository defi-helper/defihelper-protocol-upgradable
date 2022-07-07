const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('BuyLiquidity.buyLiquidity', function () {
  let owner, inToken, token0, token1, pair, router, storage, automate;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    [owner] = await ethers.getSigners();

    const InToken = await ethers.getContractFactory('ERC20Mock');
    inToken = await InToken.deploy('InToken', 'IT', new bn('10e18').toString(10));
    await inToken.deployed();

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
    await pair.transfer(router.address, await pair.balanceOf(owner.address).then((v) => v.toString()));
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

  it('buyLiquidity: should buy pair tokens and add liquidity', async function () {
    const amount = await inToken.balanceOf(owner.address).then((v) => new bn(v.toString()));
    const token0Amount = new bn(`10e18`);
    const token1Amount = new bn(`10e18`);

    strictEqual(await pair.balanceOf(owner.address).then((v) => v.toString()), '0', 'Invalid start pair token balance');

    await inToken.approve(automate.address, amount.toString(10));
    await automate.buyLiquidity(
      amount.toString(10),
      router.address,
      { path: [inToken.address, token0.address], outMin: token0Amount.toString(10) },
      { path: [inToken.address, token1.address], outMin: token1Amount.toString(10) },
      pair.address,
      0,
    );

    strictEqual(await inToken.balanceOf(owner.address).then((v) => v.toString()), '0', 'Invalid in token balance');
    strictEqual(
      await pair.balanceOf(owner.address).then((v) => v.toString()),
      new bn('10e18').toString(10),
      'Invalid end pair token balance',
    );
  });

  it('buyLiquidity: should buy the first pair of tokens and add liquidity if the second pair of tokens has already been bought', async function () {
    const token0Amount = new bn(`10e18`);
    const token1Amount = new bn(`10e18`);

    await token0.mint(owner.address, token0Amount.toString(10));
    await token0.approve(automate.address, token0Amount.toString(10));
    await automate.buyLiquidity(
      token0Amount.toString(10),
      router.address,
      { path: [token0.address], outMin: token0Amount.toString(10) },
      { path: [token0.address, token1.address], outMin: token1Amount.toString(10) },
      pair.address,
      0,
    );

    strictEqual(await token0.balanceOf(owner.address).then((v) => v.toString()), '0', 'Invalid in token balance');
    strictEqual(
      await pair.balanceOf(owner.address).then((v) => v.toString()),
      new bn('20e18').toString(10),
      'Invalid end pair token balance',
    );
  });

  it('buyLiquidity: should revert tx if router not allowed', async function () {
    await assertions.reverts(
      automate.buyLiquidity('0', zeroAddress, { path: [], outMin: 0 }, { path: [], outMin: 0 }, pair.address, 0),
      'BuyLiquidity::buyLiquidity: invalid router address',
    );
  });

  it('buyLiquidity: should revert tx if first swap0 token not equals first swap1 token', async function () {
    await assertions.reverts(
      automate.buyLiquidity(
        '0',
        router.address,
        { path: [token0.address], outMin: 0 },
        { path: [token1.address], outMin: 0 },
        pair.address,
        0,
      ),
      'BuyLiquidity::buyLiqudity: start token not equals',
    );
  });

  it('buyLiquidity: should revert tx if last swap0 token not equals pair token0', async function () {
    await assertions.reverts(
      automate.buyLiquidity(
        '0',
        router.address,
        { path: [inToken.address, token1.address], outMin: 0 },
        { path: [inToken.address, token1.address], outMin: 0 },
        pair.address,
        0,
      ),
      'BuyLiquidity::buyLiqudity: invalid token0',
    );
  });

  it('buyLiquidity: should revert tx if last swap1 token not equals pair token1', async function () {
    await assertions.reverts(
      automate.buyLiquidity(
        '0',
        router.address,
        { path: [inToken.address, token0.address], outMin: 0 },
        { path: [inToken.address, token0.address], outMin: 0 },
        pair.address,
        0,
      ),
      'BuyLiquidity::buyLiqudity: invalid token1',
    );
  });
});
