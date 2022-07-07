const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('ApprovableBalance.token', function () {
  let balance, token, newToken;
  let notOwner;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  before(async function () {
    const Token = await ethers.getContractFactory('ERC20Mock');
    token = await Token.deploy('Token', 'T', new bn('10e18').toString(10));
    await token.deployed();

    newToken = await Token.deploy('NewToken', 'NT', new bn('10e18').toString(10));
    await newToken.deployed();

    const ApprovableBalance = await ethers.getContractFactory('ApprovableBalance');
    balance = await ApprovableBalance.deploy(token.address, zeroAddress);
    await balance.deployed();

    [, notOwner] = await ethers.getSigners();
  });

  it('changeToken: should change target token', async function () {
    strictEqual(await balance.token(), token.address, 'Invalid start token');

    await balance.changeToken(newToken.address);

    strictEqual(await balance.token(), newToken.address, 'Invalid end token');
  });

  it('changeToken: should revert tx if not owner call', async function () {
    await assertions.reverts(balance.connect(notOwner).changeToken(token.address), 'Ownable: caller is not the owner');
  });
});
