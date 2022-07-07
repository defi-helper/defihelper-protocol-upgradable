const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('GovernanceToken.mintBurn', function () {
  let gov, owner, notOwner;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    [owner, notOwner] = await ethers.getSigners();

    const Gov = await ethers.getContractFactory('GovernanceToken');
    gov = await Gov.deploy(zeroAddress);
    await gov.deployed();
  });

  it('mint: should mint new tokens', async function () {
    const amount = 1e18;

    const startBalance = await gov.balanceOf(owner.address);
    const startTotalSupply = await gov.totalSupply();

    await gov.mint(owner.address, amount.toString());

    strictEqual(
      (await gov.balanceOf(owner.address)).toString(),
      new bn(startBalance.toString()).plus(amount).toString(10),
      'Invalid end balance',
    );
    strictEqual(
      (await gov.totalSupply()).toString(),
      new bn(startTotalSupply.toString()).plus(amount).toString(10),
      'Invalid end total supply',
    );
  });

  it('mint: should revert tx if not owner call', async function () {
    await assertions.reverts(
      gov.connect(notOwner).mint(owner.address, (1e18).toString()),
      'Ownable: caller is not the owner',
    );
  });

  it('mint: should revert tx if zero address', async function () {
    await assertions.reverts(
      gov.mint(zeroAddress, (1e18).toString()),
      'GovernanceToken::_mint: mint to the zero address',
    );
  });

  it('burn: should burn tokens', async function () {
    const amount = 1e18;

    const startBalance = await gov.balanceOf(owner.address);
    const startTotalSupply = await gov.totalSupply();

    await gov.burn(owner.address, amount.toString());

    strictEqual(
      (await gov.balanceOf(owner.address)).toString(),
      new bn(startBalance.toString()).minus(amount).toString(10),
      'Invalid end balance',
    );
    strictEqual(
      (await gov.totalSupply()).toString(),
      new bn(startTotalSupply.toString()).minus(amount).toString(10),
      'Invalid end total supply',
    );
  });

  it('burn: should revert tx if exceeds balance', async function () {
    await assertions.reverts(
      gov.burn(owner.address, (1e18).toString()),
      'GovernanceToken::_burn: burn amount exceeds balance',
    );
  });

  it('burn: should revert tx if not owner call', async function () {
    await assertions.reverts(
      gov.connect(notOwner).burn(owner.address, (1e18).toString()),
      'Ownable: caller is not the owner',
    );
  });

  it('burn: should revert tx if zero address', async function () {
    await assertions.reverts(
      gov.burn(zeroAddress, (1e18).toString()),
      'GovernanceToken::_burn: burn from the zero address',
    );
  });
});
