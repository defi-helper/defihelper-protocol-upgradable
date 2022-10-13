const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers, upgrades } = require('hardhat');

describe('Balance.inspector', function () {
  let balance, treasury;
  let newInspector;
  before(async function () {
    const Treasury = await ethers.getContractFactory('contracts/Treasury/TreasuryV2.sol:TreasuryV2');
    treasury = await upgrades.deployProxy(Treasury);
    await treasury.deployed();

    const Balance = await ethers.getContractFactory('contracts/Balance/BalanceV1.sol:BalanceV1');
    balance = await upgrades.deployProxy(Balance, [treasury.address], {
      initializer: 'initialize',
    });
    await balance.deployed();

    [, newInspector] = await ethers.getSigners();
  });

  it('addInspector: should add new inspector', async function () {
    strictEqual((await balance.inspectors()).length, 0, 'Invalid start inspectors list');

    await balance.addInspector(newInspector.address);

    strictEqual((await balance.inspectors()).includes(newInspector.address), true, 'Invalid end inspectors list');
  });

  it('addInspector: should revert tx if inspector already added', async function () {
    await assertions.reverts(
      balance.addInspector(newInspector.address),
      'Balance::addInspector: inspector already added',
    );
  });

  it('addInspector: should revert tx if not owner call', async function () {
    await assertions.reverts(
      balance.connect(newInspector).addInspector(newInspector.address),
      'Ownable: caller is not the owner',
    );
  });

  it('removeInspector: should remove inspector', async function () {
    strictEqual((await balance.inspectors()).includes(newInspector.address), true, 'Invalid start inspectors list');

    await balance.removeInspector(newInspector.address);

    strictEqual((await balance.inspectors()).length, 0, 'Invalid end inspectors list');
  });

  it('removeInspector: should revert tx if inspector already removed', async function () {
    await assertions.reverts(
      balance.removeInspector(newInspector.address),
      'Balance::removeInspector: inspector already removed',
    );
  });

  it('removeInspector: should revert tx if not owner call', async function () {
    await assertions.reverts(
      balance.connect(newInspector).removeInspector(newInspector.address),
      'Ownable: caller is not the owner',
    );
  });

  it('addInspector: should revert tx if inspector count maximum', async function () {
    strictEqual((await balance.inspectors()).length, 0, 'Invalid start inspectors list');

    const max = (await balance.MAXIMUM_INSPECTOR_COUNT()).toString();
    for (let i = 0; i < max; i++) {
      const wallet = ethers.Wallet.createRandom();

      await balance.addInspector(wallet.address);
    }
    await assertions.reverts(
      balance.addInspector(newInspector.address),
      'Balance::addInspector: inspector must not exceed maximum count',
    );
  });
});
