const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

describe('ApprovableBalance.token', function () {
  let balance, token;
  let consumer, recipient, notOwner;
  const treasuryAddress = '0x0000000000000000000000000000000000000001';
  const totalSupply = new bn('10e18');
  before(async function () {
    [recipient, consumer, notOwner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('ERC20Mock');
    token = await Token.deploy('Token', 'T', totalSupply.toFixed(0));
    await token.deployed();

    const ApprovableBalance = await ethers.getContractFactory('ApprovableBalance');
    balance = await ApprovableBalance.deploy(token.address, treasuryAddress);
    await balance.deployed();
    await balance.addConsumer(consumer.address);
  });

  it('claim: should save tokens if call recipient', async function () {
    const amount = new bn(`1e18`);
    const gasFee = new bn(`1e16`);
    const protocolFee = new bn(`1e16`);

    strictEqual(
      await token.balanceOf(treasuryAddress).then((v) => v.toString()),
      '0',
      'Invalid start treasury balance',
    );
    strictEqual(
      await token.balanceOf(recipient.address).then((v) => v.toString()),
      totalSupply.toFixed(0),
      'Invalid start recipient balance',
    );

    await token.approve(balance.address, amount.toFixed(0));
    await balance.claim(recipient.address, gasFee.toFixed(0), protocolFee.toFixed(0));

    strictEqual(await token.balanceOf(treasuryAddress).then((v) => v.toString()), '0', 'Invalid end balance');
    strictEqual(
      await token.balanceOf(recipient.address).then((v) => v.toString()),
      totalSupply.toFixed(0),
      'Invalid end recipient balance',
    );
  });

  it('claim: should claim tokens', async function () {
    const amount = new bn(`1e18`);
    const gasFee = new bn(`1e16`);
    const protocolFee = new bn(`1e16`);

    strictEqual(
      await token.balanceOf(treasuryAddress).then((v) => v.toString()),
      '0',
      'Invalid start treasury balance',
    );
    strictEqual(
      await token.balanceOf(recipient.address).then((v) => v.toString()),
      totalSupply.toFixed(0),
      'Invalid start recipient balance',
    );

    await token.approve(balance.address, amount.toFixed(0));
    await balance.connect(consumer).claim(recipient.address, gasFee.toFixed(0), protocolFee.toFixed(0));

    strictEqual(
      await token.balanceOf(treasuryAddress).then((v) => v.toString()),
      gasFee.plus(protocolFee).toFixed(0),
      'Invalid end balance',
    );
    strictEqual(
      await token.balanceOf(recipient.address).then((v) => v.toString()),
      totalSupply.minus(gasFee).minus(protocolFee).toFixed(0),
      'Invalid end recipient balance',
    );
  });

  it('claim: should revert tx if not consumer or recipient call', async function () {
    await assertions.reverts(
      balance.connect(notOwner).claim(recipient.address, '0', '0'),
      'ApprovableBalance: caller is not a consumer',
    );
  });
});
