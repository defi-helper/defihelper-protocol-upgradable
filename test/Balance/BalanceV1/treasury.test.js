const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers, upgrades } = require('hardhat');

describe('Balance.treasury', function () {
  let balance, treasury;
  let newTreasury;
  before(async function () {
    const Treasury = await ethers.getContractFactory('contracts/Treasury/TreasuryV2.sol:TreasuryV2');
    treasury = await upgrades.deployProxy(Treasury);
    await treasury.deployed();

    const Balance = await ethers.getContractFactory('contracts/Balance/BalanceV1.sol:BalanceV1');
    balance = await upgrades.deployProxy(Balance, [treasury.address], {
      initializer: 'initialize',
    });
    await balance.deployed();

    [, newTreasury] = await ethers.getSigners();
  });

  it('treasury: should return treasury contract address', async function () {
    strictEqual(await balance.treasury(), treasury.address, 'Invalid treasury address');
  });

  it('changeTreasury: should change treasury address', async function () {
    await balance.changeTreasury(newTreasury.address);

    strictEqual(await balance.treasury(), newTreasury.address, 'Invalid treasury address');
  });

  it('changeTreasury: should revert tx if not owner call', async function () {
    await assertions.reverts(
      balance.connect(newTreasury).changeTreasury(newTreasury.address),
      'Ownable: caller is not the owner',
    );
  });
});
