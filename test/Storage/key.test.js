const { strictEqual } = require('assert');
const assertions = require('truffle-assertions');
const { ethers } = require('hardhat');
const bn = require('bignumber.js');

const key = (k) => ethers.utils.keccak256(ethers.utils.toUtf8Bytes(k));

describe('Storage.key', function () {
  let storage, account, other;
  const bytesKey = key('bytes');
  const bytes = ethers.utils.toUtf8Bytes('123');
  const boolKey = key('bool');
  const bool = true;
  const uintKey = key('uint');
  const uint = 123;
  const intKey = key('int');
  const int = -123;
  const addressKey = key('address');
  const address = '0x0000000000000000000000000000000000000001';
  const stringKey = key('string');
  const string = 'test';
  before(async function () {
    const Storage = await ethers.getContractFactory('Storage');
    storage = await Storage.deploy();
    await storage.deployed();

    [account, other] = await ethers.getSigners();
  });

  it('setBytes: should set bytes value', async function () {
    await storage.setBytes(bytesKey, bytes);

    strictEqual(
      JSON.stringify(ethers.utils.arrayify(await storage.getBytes(bytesKey))),
      JSON.stringify(bytes),
      'Invalid bytes value',
    );
  });

  it('setBytes: should revert tx if not owner call', async function () {
    await assertions.reverts(storage.connect(other).setBytes(bytesKey, bytes), 'Ownable: caller is not the owner');
  });

  it('deleteBytes: should delete bytes value', async function () {
    await storage.deleteBytes(bytesKey);

    strictEqual(
      JSON.stringify(ethers.utils.arrayify(await storage.getBytes(bytesKey))),
      JSON.stringify(ethers.utils.toUtf8Bytes('')),
      'Invalid bytes value',
    );
  });

  it('deleteBytes: should revert tx if not owner call', async function () {
    await assertions.reverts(storage.connect(other).deleteBytes(bytesKey), 'Ownable: caller is not the owner');
  });

  it('setBool: should set bool value', async function () {
    await storage.setBool(boolKey, bool);

    strictEqual(await storage.getBool(boolKey), bool, 'Invalid bool value');
  });

  it('setBool: should revert tx if not owner call', async function () {
    await assertions.reverts(storage.connect(other).setBool(boolKey, bool), 'Ownable: caller is not the owner');
  });

  it('deleteBool: should delete bool value', async function () {
    await storage.deleteBool(boolKey);

    strictEqual(await storage.getBool(boolKey), false, 'Invalid bool value');
  });

  it('deleteBool: should revert tx if not owner call', async function () {
    await assertions.reverts(storage.connect(other).deleteBool(boolKey), 'Ownable: caller is not the owner');
  });

  it('setUint: should set uint value', async function () {
    await storage.setUint(uintKey, uint);

    strictEqual((await storage.getUint(uintKey)).toNumber(), uint, 'Invalid uint value');
  });

  it('setUint: should revert tx if not owner call', async function () {
    await assertions.reverts(storage.connect(other).setUint(uintKey, uint), 'Ownable: caller is not the owner');
  });

  it('deleteUint: should delete uint value', async function () {
    await storage.deleteUint(uintKey);

    strictEqual((await storage.getUint(uintKey)).toNumber(), 0, 'Invalid uint value');
  });

  it('deleteUint: should revert tx if not owner call', async function () {
    await assertions.reverts(storage.connect(other).deleteUint(uintKey), 'Ownable: caller is not the owner');
  });

  it('setInt: should set int value', async function () {
    await storage.setInt(intKey, int);

    strictEqual((await storage.getInt(intKey)).toNumber(), int, 'Invalid int value');
  });

  it('setInt: should revert tx if not owner call', async function () {
    await assertions.reverts(storage.connect(other).setInt(intKey, int), 'Ownable: caller is not the owner');
  });

  it('deleteInt: should delete int value', async function () {
    await storage.deleteInt(intKey);

    strictEqual((await storage.getInt(intKey)).toNumber(), 0, 'Invalid int value');
  });

  it('deleteInt: should revert tx if not owner call', async function () {
    await assertions.reverts(storage.connect(other).deleteInt(intKey), 'Ownable: caller is not the owner');
  });

  it('setAddress: should set address value', async function () {
    await storage.setAddress(addressKey, address);

    strictEqual(await storage.getAddress(addressKey), address, 'Invalid address value');
  });

  it('setAddress: should revert tx if not owner call', async function () {
    await assertions.reverts(
      storage.connect(other).setAddress(addressKey, address),
      'Ownable: caller is not the owner',
    );
  });

  it('deleteAddress: should delete address value', async function () {
    await storage.deleteAddress(addressKey);

    strictEqual(
      await storage.getAddress(addressKey),
      '0x0000000000000000000000000000000000000000',
      'Invalid address value',
    );
  });

  it('deleteAddress: should revert tx if not owner call', async function () {
    await assertions.reverts(storage.connect(other).deleteAddress(addressKey), 'Ownable: caller is not the owner');
  });

  it('setString: should set string value', async function () {
    await storage.setString(stringKey, string);

    strictEqual(await storage.getString(stringKey), string, 'Invalid string value');
  });

  it('setString: should revert tx if not owner call', async function () {
    await assertions.reverts(storage.connect(other).setString(stringKey, string), 'Ownable: caller is not the owner');
  });

  it('deleteString: should delete string value', async function () {
    await storage.deleteString(stringKey);

    strictEqual(
      await storage.getString(stringKey),
      '',
      'Invalid string value',
    );
  });

  it('deleteString: should revert tx if not owner call', async function () {
    await assertions.reverts(storage.connect(other).deleteString(stringKey), 'Ownable: caller is not the owner');
  });
});
