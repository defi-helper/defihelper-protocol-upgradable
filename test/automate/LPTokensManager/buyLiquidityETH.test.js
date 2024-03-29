const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('LPTokensManager.buyLiquidityETH', function () {
  let owner, treasury, inToken, token0, token1, pair, router, storage, priceFeed, weth, automate;
  const fee = new bn('1e8').toFixed(0);
  const nativeTokenUSD = new bn('1000e8').toFixed(0);
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    [owner] = await ethers.getSigners();

    const Treasury = await ethers.getContractFactory('contracts/Treasury/TreasuryV2.sol:TreasuryV2');
    treasury = await upgrades.deployProxy(Treasury);
    await treasury.deployed();

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

  it('buyLiquidityETH: should buy liquidity with native token', async function () {
    const wethAmount = new bn('1e18');
    const token0Amount = new bn(`10e18`);
    const token1Amount = new bn(`10e18`);
    const fee = await automate.fee().then((v) => v.toString());

    strictEqual(await pair.balanceOf(owner.address).then((v) => v.toString()), '0', 'Invalid start pair token balance');

    await automate.buyLiquidityETH(
      router.address,
      { path: [weth.address, token0.address], outMin: token0Amount.toString(10) },
      { path: [weth.address, token1.address], outMin: token1Amount.toString(10) },
      pair.address,
      0,
      {
        value: wethAmount.plus(fee).toFixed(0),
      },
    );

    strictEqual(
      await pair.balanceOf(owner.address).then((v) => v.toString()),
      new bn('10e18').toString(10),
      'Invalid end pair token balance',
    );
  });
});
