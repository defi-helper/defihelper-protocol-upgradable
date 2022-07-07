const { strictEqual } = require('assert');
const { artifacts, ethers } = require('hardhat');

describe('ProxyFactory.create', function () {
  let proxyFactory;
  let account;
  before(async function () {
    [account] = await ethers.getSigners();

    const ERC1167 = await ethers.getContractFactory('ERC1167');
    const erc1167 = await ERC1167.deploy();
    await erc1167.deployed();

    const ProxyFactory = await ethers.getContractFactory('ProxyFactory', {
      libraries: {
        ERC1167: erc1167.address,
      },
    });
    proxyFactory = await ProxyFactory.deploy();
    await proxyFactory.deployed();
  });

  it('create: should create and initialize proxy ', async function () {
    const { abi: PrototypeABI } = await artifacts.readArtifact('ERC20Mock');
    const Prototype = await ethers.getContractFactory('ERC20Mock');
    const prototype = await Prototype.deploy('Prototype', 'P', 0);
    await prototype.deployed();
    strictEqual((await prototype.totalSupply()).toString(), '0', 'Invalid start total supply');

    const proxy1MintAmount = 100;
    const proxy1Tx = await (
      await proxyFactory.create(
        prototype.address,
        new ethers.utils.Interface(PrototypeABI).encodeFunctionData('mint', [account.address, proxy1MintAmount]),
      )
    ).wait();
    const proxy1CreatedEvent = proxy1Tx.events.find(({ event }) => event === 'ProxyCreated');
    strictEqual(proxy1CreatedEvent !== undefined, true, 'Proxy 1 not created');
    const proxy1 = new ethers.Contract(proxy1CreatedEvent.args.proxy, PrototypeABI, ethers.provider);
    strictEqual((await proxy1.totalSupply()).toString(), proxy1MintAmount.toString(), 'Invalid proxy 1 total supply');
    strictEqual(proxy1.address != prototype.address, true, 'Invalid proxy 1 address');

    const proxy2MintAmount = 50;
    const proxy2Tx = await (
      await proxyFactory.create(
        prototype.address,
        new ethers.utils.Interface(PrototypeABI).encodeFunctionData('mint', [account.address, proxy2MintAmount]),
      )
    ).wait();
    const proxy2CreatedEvent = proxy2Tx.events.find(({ event }) => event === 'ProxyCreated');
    strictEqual(proxy2CreatedEvent !== undefined, true, 'Proxy 2 not created');
    const proxy2 = new ethers.Contract(proxy2CreatedEvent.args.proxy, PrototypeABI, ethers.provider);
    strictEqual((await proxy2.totalSupply()).toString(), proxy2MintAmount.toString(), 'Invalid proxy 2 total supply');
    strictEqual(proxy2.address != prototype.address, true, 'Invalid proxy 2 address');
    strictEqual(proxy2.address != proxy1.address, true, 'Proxy 1 and proxy 2 addresses equals');
    strictEqual((await prototype.totalSupply()).toString(), '0', 'Invalid end total supply');
  });

  it('create: should create proxy without initialize args', async function () {
    const { abi: PrototypeABI } = await artifacts.readArtifact('ERC20Mock');
    const Prototype = await ethers.getContractFactory('ERC20Mock');
    const prototype = await Prototype.deploy('Prototype', 'P', 0);
    await prototype.deployed();
    strictEqual((await prototype.totalSupply()).toString(), '0', 'Invalid start total supply');

    const proxyTx = await (await proxyFactory.create(prototype.address, '0x')).wait();
    const proxyCreatedEvent = proxyTx.events.find(({ event }) => event === 'ProxyCreated');
    strictEqual(proxyCreatedEvent !== undefined, true, 'Proxy not created');
    const proxy = new ethers.Contract(proxyCreatedEvent.args.proxy, PrototypeABI, ethers.provider);
    strictEqual((await proxy.totalSupply()).toString(), '0', 'Invalid proxy total supply');
    strictEqual(proxy.address != prototype.address, true, 'Invalid proxy address');
  });
});
