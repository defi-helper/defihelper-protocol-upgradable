const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');

describe('Balance.treasury', function () {
  let balance;
  let newTreasury;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    const Balance = await ethers.getContractFactory('Balance');
    balance = await Balance.deploy(zeroAddress);
    await balance.deployed();

    [, newTreasury] = await ethers.getSigners();
  });

  it('treasury: should return treasury contract address', async function () {
    strictEqual(await balance.treasury(), zeroAddress, 'Invalid treasury address');
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
