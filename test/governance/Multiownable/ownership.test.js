const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');

describe('Multiownable.ownership', function () {
  let owner, owner2, owner3, notOwner, multiownable;
  before(async function () {
    [owner, owner2, owner3, notOwner] = await ethers.getSigners();

    const Multiownable = await ethers.getContractFactory('Multiownable');
    multiownable = await Multiownable.deploy();
    await multiownable.deployed();
  });

  it('isOwner: should check if the address is the owner', async function () {
    strictEqual(await multiownable.isOwner(owner.address), true, 'Invalid owner');
    strictEqual(await multiownable.isOwner(notOwner.address), false, 'Invalid not owner');
  });

  it('ownersCount: should return owners count', async function () {
    strictEqual((await multiownable.ownersCount()).toString(), '1', 'Invalid owners count');
  });

  it('transferOwnershipWithHowMany: should transafer ownership with how many owners decide', async function () {
    strictEqual(await multiownable.isOwner(owner.address), true, 'Invalid start owner');
    strictEqual(await multiownable.isOwner(owner2.address), false, 'Invalid start owner2');
    strictEqual(await multiownable.isOwner(owner3.address), false, 'Invalid start owner3');
    strictEqual((await multiownable.ownersCount()).toString(), '1', 'Invalid start owners count');
    strictEqual((await multiownable.howManyOwnersDecide()).toString(), '1', 'Invalid start how many owners decide');
    strictEqual(await multiownable.owners(0), owner.address, 'Invalid start first owner');
    strictEqual((await multiownable.allOperationsCount()).toString(), '0', 'Invalid start all operations count');

    const howManyOwnersDecide = '2';
    await multiownable.transferOwnershipWithHowMany(
      [owner.address, owner2.address, owner3.address],
      howManyOwnersDecide,
    );

    strictEqual(await multiownable.isOwner(owner.address), true, 'Invalid end owner');
    strictEqual(await multiownable.isOwner(owner2.address), true, 'Invalid end owner2');
    strictEqual(await multiownable.isOwner(owner3.address), true, 'Invalid end owner3');
    strictEqual((await multiownable.ownersCount()).toString(), '3', 'Invalid end owners count');
    strictEqual(
      (await multiownable.howManyOwnersDecide()).toString(),
      howManyOwnersDecide,
      'Invalid end how many owners decide',
    );
    strictEqual(await multiownable.owners(0), owner.address, 'Invalid end first owner');
    strictEqual(await multiownable.owners(1), owner2.address, 'Invalid end second owner');
    strictEqual(await multiownable.owners(2), owner3.address, 'Invalid end third owner');
    strictEqual((await multiownable.allOperationsCount()).toString(), '0', 'Invalid end all operations count');
  });

  it('transferOwnershipWithHowMany: should revert tx if not owner call', async function () {
    await assertions.reverts(
      multiownable.connect(notOwner).transferOwnershipWithHowMany([owner.address], 1),
      'checkHowManyOwners: msg.sender is not an owner',
    );
  });

  it('cancelPending: should cancel vote', async function () {
    strictEqual((await multiownable.ownersCount()).toString(), '3', 'Invalid start owners count');

    await multiownable.connect(owner2).transferOwnershipWithHowMany([owner.address], 1);
    strictEqual((await multiownable.allOperationsCount()).toString(), '1', 'Invalid middle all operations count');

    await multiownable.connect(owner2).cancelPending(await multiownable.allOperations(0));

    strictEqual((await multiownable.ownersCount()).toString(), '3', 'Invalid end owners count');
    strictEqual((await multiownable.allOperationsCount()).toString(), '0', 'Invalid end all operations count');
  });

  it('transferOwnershipWithHowMany: should transafer ownership with how many owners decide with multisig', async function () {
    strictEqual(await multiownable.isOwner(owner.address), true, 'Invalid start owner');
    strictEqual(await multiownable.isOwner(owner2.address), true, 'Invalid start owner2');
    strictEqual(await multiownable.isOwner(owner3.address), true, 'Invalid start owner3');
    strictEqual((await multiownable.ownersCount()).toString(), '3', 'Invalid start owners count');
    strictEqual((await multiownable.howManyOwnersDecide()).toString(), '2', 'Invalid start how many owners decide');
    strictEqual((await multiownable.allOperationsCount()).toString(), '0', 'Invalid start all operations count');

    await multiownable.connect(owner2).transferOwnershipWithHowMany([owner.address], 1);
    strictEqual((await multiownable.allOperationsCount()).toString(), '1', 'Invalid middle all operations count');
    strictEqual((await multiownable.ownersCount()).toString(), '3', 'Invalid start owners count');
    await multiownable.connect(owner3).transferOwnershipWithHowMany([owner.address], 1);

    strictEqual(await multiownable.isOwner(owner.address), true, 'Invalid end owner');
    strictEqual(await multiownable.isOwner(owner2.address), false, 'Invalid end owner2');
    strictEqual(await multiownable.isOwner(owner3.address), false, 'Invalid end owner3');
    strictEqual((await multiownable.ownersCount()).toString(), '1', 'Invalid end owners count');
    strictEqual((await multiownable.howManyOwnersDecide()).toString(), '1', 'Invalid end how many owners decide');
    strictEqual(await multiownable.owners(0), owner.address, 'Invalid end first owner');
    strictEqual((await multiownable.allOperationsCount()).toString(), '0', 'Invalid end all operations count');
  });
});
