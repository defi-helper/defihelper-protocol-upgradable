const { strictEqual } = require('assert');
const { ethers } = require('hardhat');
const BN = require('bignumber.js');
const { token, priceFeedDeploy, storageDeploy, uni3, feeAmount, nearestUsableTick } = require('./utils');

describe('Uni3/LPTokensManager.buyLiquidity', function () {
  let weth, token0, token1, positionManager, pool, router, automate, account;
  before(async function () {
    account = await ethers.getImpersonatedSigner('0xFa02EDF9ebA53Ae811650e409A1da2E6103CDB54');

    weth = await token({ signer: account, address: '0x9e33bA3217560a0a07a29CEEE333D9518E970120' });

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
          value: new BN(`5e${priceFeed.decimals}`).toFixed(0),
        },
      ],
    });

    const Automate = await ethers.getContractFactory('contracts/automate/Uni3/LPTokensManager.sol:LPTokensManager');
    automate = await Automate.deploy(storage.contract.address);
    await automate.deployed();
  });

  it('buyLiquidity: should buy liquidity', async function () {
    const tickSpacing = await pool.tickSpacing();
    const currentTick = await pool.slot0().then(({ tick }) => nearestUsableTick(tick, tickSpacing));
    const comission = await automate.fee().then((v) => v.toString());

    const amount = new BN('1e16').toFixed(0);
    await weth.approve(automate.address, amount);
    await automate.connect(account).buyLiquidity(
      {
        positionManager: positionManager.address,
        router: router.address,
        from: weth.address,
        amount,
        swap: {
          path: ethers.utils.solidityPack(
            ['address', 'uint24', 'address'],
            [weth.address, feeAmount.MEDIUM, token1.address],
          ),
          outMin: 0,
        },
        to: pool.address,
        tickLower: currentTick - tickSpacing * 10,
        tickUpper: currentTick + tickSpacing * 10,
        deadline: Math.floor((Date.now() + 10_000) / 1_000),
      },
      { value: comission },
    );
  });

  it('buyLiquidity: should buy liquidity without third token', async function () {
    const tickSpacing = await pool.tickSpacing();
    const currentTick = await pool.slot0().then(({ tick }) => nearestUsableTick(tick, tickSpacing));
    const comission = await automate.fee().then((v) => v.toString());

    const amount = new BN('10e18').toFixed(0);
    await token0.approve(automate.address, amount);
    await automate.connect(account).buyLiquidity(
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
    );
  });

  it('buyLiquidityETH: should buy liquidity with native token', async function () {
    const tickSpacing = await pool.tickSpacing();
    const currentTick = await pool.slot0().then(({ tick }) => nearestUsableTick(tick, tickSpacing));
    const comission = await automate.fee().then((v) => v.toString());

    const amount = new BN('1e16').toFixed(0);
    await automate.connect(account).buyLiquidityETH(
      {
        positionManager: positionManager.address,
        router: router.address,
        from: weth.address,
        amount,
        swap: {
          path: ethers.utils.solidityPack(
            ['address', 'uint24', 'address'],
            [weth.address, feeAmount.MEDIUM, token1.address],
          ),
          outMin: 0,
        },
        to: pool.address,
        tickLower: currentTick - tickSpacing * 10,
        tickUpper: currentTick + tickSpacing * 10,
        deadline: Math.floor((Date.now() + 10_000) / 1_000),
      },
      { value: new BN(comission).plus(amount).toFixed() },
    );
  });
});
