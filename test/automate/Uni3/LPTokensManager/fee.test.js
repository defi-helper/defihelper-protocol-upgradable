const { strictEqual } = require('assert');
const { ethers } = require('hardhat');
const BN = require('bignumber.js');
const { priceFeedDeploy, storageDeploy } = require('./utils');

describe('Uni3/LPTokensManager.fee', function () {
  let automate;
  const fee = 20;
  const nativePriceUSD = 5;
  before(async function () {
    const priceFeed = await priceFeedDeploy({ price: nativePriceUSD });

    const storage = await storageDeploy({
      data: [
        { method: 'setAddress', key: 'DFH:Fee:PriceFeed', value: priceFeed.contract.address },
        {
          method: 'setUint',
          key: 'DFH:Fee:Automate:Uni3:LPTokensManager',
          value: new BN(`${fee}e${priceFeed.decimals}`).toFixed(0),
        },
      ],
    });

    const Automate = await ethers.getContractFactory('contracts/automate/Uni3/LPTokensManager.sol:LPTokensManager');
    automate = await Automate.deploy(storage.contract.address);
    await automate.deployed();

    [owner, notOwner] = await ethers.getSigners();
  });

  it('fee: should return fees value', async function () {
    strictEqual(
      await automate.fee().then((v) => v.toString()),
      new BN(fee).div(nativePriceUSD).multipliedBy('1e18').toFixed(0),
      'Invalid fees value',
    );
  });
});
