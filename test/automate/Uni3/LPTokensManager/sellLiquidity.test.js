const { strictEqual } = require('assert');
const hardhat = require('hardhat');
const BN = require('bignumber.js');
const { priceFeedDeploy, storageDeploy, uni3, feeAmount, nearestUsableTick } = require('./utils');
const { ethers } = hardhat;

describe('Uni3/LPTokensManager.sellLiquidity', function () {
  let weth, token0, token1, positionManager, pool, router, automate, account;
  before(async function () {
    account = await ethers.getImpersonatedSigner('0xFa02EDF9ebA53Ae811650e409A1da2E6103CDB54');

    const WETH = await hardhat.artifacts.readArtifact('contracts/interfaces/NativeWrapper/mock/WrapMock.sol:WrapMock');
    weth = new ethers.Contract('0x9e33bA3217560a0a07a29CEEE333D9518E970120', WETH.abi, account);

    const uni3Contract = await uni3({ signer: account });
    token0 = uni3Contract.token0;
    token1 = uni3Contract.token1;
    positionManager = uni3Contract.positionManager;
    pool = uni3Contract.pool;
    router = uni3Contract.router;

    const Treasury = await ethers.getContractFactory('Treasury');
    const treasury = await Treasury.deploy();
    await treasury.deployed();

    const priceFeed = await priceFeedDeploy({ price: 5 });

    const storage = await storageDeploy({
      data: [
        { method: 'setAddress', key: 'DFH:Fee:PriceFeed', value: priceFeed.contract.address },
        { method: 'setAddress', key: 'DFH:Contract:Treasury', value: treasury.address },
        { method: 'setAddress', key: 'NativeWrapper:Contract', value: weth.address },
        {
          method: 'setUint',
          key: 'DFH:Fee:Automate:Uni3:LPTokensManager',
          value: new BN(`20e${priceFeed.decimals}`).toFixed(0),
        },
      ],
    });

    const Automate = await ethers.getContractFactory('contracts/automate/Uni3/LPTokensManager.sol:LPTokensManager');
    automate = await Automate.deploy(storage.contract.address);
    await automate.deployed();
  });

  it('sellLiquidity: should sell liquidity', async function () {
    const tickSpacing = await pool.tickSpacing();
    const currentTick = await pool.slot0().then(({ tick }) => nearestUsableTick(tick, tickSpacing));
    const comission = await automate.fee().then((v) => v.toString());
    const amount = new BN('10e18').toFixed(0);
    await token0.approve(automate.address, amount);
    const receipt = await automate
      .connect(account)
      .buyLiquidity(
        {
          positionManager: positionManager.address,
          router: router.address,
          from: token0.address,
          amount,
          swap: {
            path: '0x',
            outMin: 0,
          },
          to: pool.address,
          tickLower: currentTick - tickSpacing * 10,
          tickUpper: currentTick + tickSpacing * 10,
          deadline: Math.floor((Date.now() + 10_000) / 1_000),
        },
        { value: comission },
      )
      .then((tx) => tx.wait());
    const tokenId = receipt.events.find(({ event }) => event === 'BuyLiquidity')?.args.tokenId.toString();

    await positionManager.approve(automate.address, tokenId);
    await automate.connect(account).sellLiquidity(
      {
        positionManager: positionManager.address,
        router: router.address,
        from: tokenId,
        swap: {
          path: ethers.utils.solidityPack(
            ['address', 'uint24', 'address'],
            [token1.address, feeAmount.MEDIUM, weth.address],
          ),
          outMin: 0,
        },
        to: weth.address,
        deadline: Math.floor((Date.now() + 10_000) / 1_000),
      },
      { value: comission },
    );
  });

  it('sellLiquidity: should sell liquidity without third token', async function () {
    const tickSpacing = await pool.tickSpacing();
    const currentTick = await pool.slot0().then(({ tick }) => nearestUsableTick(tick, tickSpacing));
    const comission = await automate.fee().then((v) => v.toString());
    const amount = new BN('10e18').toFixed(0);
    await token0.approve(automate.address, amount);
    const receipt = await automate
      .connect(account)
      .buyLiquidity(
        {
          positionManager: positionManager.address,
          router: router.address,
          from: token0.address,
          amount,
          swap: {
            path: '0x',
            outMin: 0,
          },
          to: pool.address,
          tickLower: currentTick - tickSpacing * 10,
          tickUpper: currentTick + tickSpacing * 10,
          deadline: Math.floor((Date.now() + 10_000) / 1_000),
        },
        { value: comission },
      )
      .then((tx) => tx.wait());
    const tokenId = receipt.events.find(({ event }) => event === 'BuyLiquidity')?.args.tokenId.toString();

    await positionManager.approve(automate.address, tokenId);
    await automate.connect(account).sellLiquidity(
      {
        positionManager: positionManager.address,
        router: router.address,
        from: tokenId,
        swap: {
          path: '0x',
          outMin: 0,
        },
        to: token0.address,
        deadline: Math.floor((Date.now() + 10_000) / 1_000),
      },
      { value: comission },
    );
  });

  it('sellLiquidityETH: should sell liquidity with native token', async function () {
    const tickSpacing = await pool.tickSpacing();
    const currentTick = await pool.slot0().then(({ tick }) => nearestUsableTick(tick, tickSpacing));
    const comission = await automate.fee().then((v) => v.toString());
    const amount = new BN('10e18').toFixed(0);
    await token0.approve(automate.address, amount);
    const receipt = await automate
      .connect(account)
      .buyLiquidity(
        {
          positionManager: positionManager.address,
          router: router.address,
          from: token0.address,
          amount,
          swap: {
            path: '0x',
            outMin: 0,
          },
          to: pool.address,
          tickLower: currentTick - tickSpacing * 10,
          tickUpper: currentTick + tickSpacing * 10,
          deadline: Math.floor((Date.now() + 10_000) / 1_000),
        },
        { value: comission },
      )
      .then((tx) => tx.wait());
    const tokenId = receipt.events.find(({ event }) => event === 'BuyLiquidity')?.args.tokenId.toString();

    await weth.deposit({ value: new BN('1e18').toFixed(0) });
    await positionManager.approve(automate.address, tokenId);
    await automate.connect(account).sellLiquidityETH(
      {
        positionManager: positionManager.address,
        router: router.address,
        from: tokenId,
        swap: {
          path: ethers.utils.solidityPack(
            ['address', 'uint24', 'address'],
            [token1.address, feeAmount.MEDIUM, weth.address],
          ),
          outMin: 0,
        },
        to: weth.address,
        deadline: Math.floor((Date.now() + 10_000) / 1_000),
      },
      { value: comission },
    );
  });
});
