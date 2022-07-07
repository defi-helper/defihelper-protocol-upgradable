const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');

describe('GovernorMultisig.executeTransaction', function () {
  let owner, owner2, owner3, notOwner, gov, token;
  const totalSupply = `${30e6}`;
  before(async function () {
    [owner, owner2, owner3, notOwner] = await ethers.getSigners();

    const Gov = await ethers.getContractFactory('GovernorMultisig');
    gov = await Gov.deploy();
    await gov.deployed();
    await gov.transferOwnershipWithHowMany([owner.address, owner2.address, owner3.address], '2');

    const ERC20 = await ethers.getContractFactory('ERC20Mock');
    token = await ERC20.deploy('Token', 'T', totalSupply);
    await token.deployed();
    await token.transfer(gov.address, totalSupply).then((tx) => tx.wait());
  });

  it('executeTransaction: should execute transaction if many owners vote for', async function () {
    strictEqual(await token.balanceOf(gov.address).then((v) => v.toString()), totalSupply, 'Invalid start gov balance');
    strictEqual(await token.balanceOf(owner.address).then((v) => v.toString()), '0', 'Invalid start owner 1 balance');
    strictEqual(await token.balanceOf(owner2.address).then((v) => v.toString()), '0', 'Invalid start owner 2 balance');
    strictEqual(await token.balanceOf(owner3.address).then((v) => v.toString()), '0', 'Invalid start owner 3 balance');

    const targets = [token.address, token.address, token.address];
    const values = [0, 0, 0];
    const signatures = ['transfer(address,uint256)', 'transfer(address,uint256)', 'transfer(address,uint256)'];
    const calldatas = [
      ethers.utils.defaultAbiCoder.encode(['address', 'uint256'], [owner.address, `${15e6}`]),
      ethers.utils.defaultAbiCoder.encode(['address', 'uint256'], [owner2.address, `${10e6}`]),
      ethers.utils.defaultAbiCoder.encode(['address', 'uint256'], [owner3.address, `${5e6}`]),
    ];

    await gov.executeTransaction(targets, values, signatures, calldatas);
    strictEqual(
      await token.balanceOf(gov.address).then((v) => v.toString()),
      totalSupply,
      'Invalid middle gov balance',
    );
    strictEqual(await token.balanceOf(owner.address).then((v) => v.toString()), '0', 'Invalid middle owner 1 balance');
    strictEqual(await token.balanceOf(owner2.address).then((v) => v.toString()), '0', 'Invalid middle owner 2 balance');
    strictEqual(await token.balanceOf(owner3.address).then((v) => v.toString()), '0', 'Invalid middle owner 3 balance');

    await gov.connect(owner2).executeTransaction(targets, values, signatures, calldatas);
    strictEqual(await token.balanceOf(gov.address).then((v) => v.toString()), '0', 'Invalid end gov balance');
    strictEqual(
      await token.balanceOf(owner.address).then((v) => v.toString()),
      `${15e6}`,
      'Invalid end owner 1 balance',
    );
    strictEqual(
      await token.balanceOf(owner2.address).then((v) => v.toString()),
      `${10e6}`,
      'Invalid end owner 2 balance',
    );
    strictEqual(
      await token.balanceOf(owner3.address).then((v) => v.toString()),
      `${5e6}`,
      'Invalid end owner 3 balance',
    );
  });

  it('executeTransaction: should revert tx if not owner call', async function () {
    await token.mint(gov.address, totalSupply).then((tx) => tx.wait());

    const targets = [token.address];
    const values = [0];
    const signatures = ['transfer(address,uint256)'];
    const calldatas = [ethers.utils.defaultAbiCoder.encode(['address', 'uint256'], [owner.address, `${1e6}`])];
    await assertions.reverts(
      gov.connect(notOwner).executeTransaction(targets, values, signatures, calldatas),
      'checkHowManyOwners: msg.sender is not an owner',
    );
  });
});
