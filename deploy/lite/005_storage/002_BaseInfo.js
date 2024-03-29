const { migration } = require('../../../scripts/deploy');
const { network } = require('hardhat');
const { utils } = require('ethers');

const defaultChainId = 31337;

module.exports = migration(async (deployer) => {
  const [governor, balance, budget, treasury] = await Promise.all([
    deployer.artifacts.readDeploy('GovernorMultisig'),
    deployer.artifacts.readDeploy('BalanceUpgradable'),
    deployer.artifacts.readDeploy('Budget'),
    deployer.artifacts.readDeploy('TreasuryUpgradable'),
  ]);
  const values = [
    { method: 'setAddress', key: 'DFH:Contract:Governor', value: governor.address },
    { method: 'setAddress', key: 'DFH:Contract:Budget', value: budget.address },
    { method: 'setAddress', key: 'DFH:Contract:Balance', value: balance.address },
    { method: 'setAddress', key: 'DFH:Contract:Treasury', value: treasury.address },
    { method: 'setAddress', key: 'DFH:Pauser', value: deployer.namedAccounts.deployer.address },
    { method: 'setUint', key: 'DFH:Fee:Automate', value: 1e8 },
    { method: 'setUint', key: 'DFH:Fee:Automate:Uni3:LPTokensManager', value: 1e8 },
    { method: 'setUint', key: 'DFH:Fee:Automate:LPTokensManager', value: 1e8 },
    ...[
      {
        method: 'setAddress',
        key: 'DFH:Fee:PriceFeed',
        value: {
          1: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
          3: '0x32FAC1bc00973413c2714734B0b48Dd0CC68F63D',
          4: '0x78F9e60608bF48a1155b4B2A5e31F32318a1d85F',
          5: '0x6FaEb39c3FC2cE57b19860f6785d0572D7B0ae0A',
          10: '0x13e3Ee699D1909E989722E753853AE30b17e08c5',
          42: '0x9326BFA02ADD2366b30bacB125260Af641031331',
          56: '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE',
          97: '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526',
          137: '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0',
          1285: '0x3f8BFbDc1e79777511c00Ad8591cef888C2113C1',
          42161: '0x639fe6ab55c921f74e7fac1ee960c0b6293ba612',
          43113: '0x5498BB86BC934c8D34FDA08E81D444153d0D06aD',
          43114: '0x0A77230d17318075983913bC2145DB16C7366156',
          80001: '0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada',
        }[network.config.chainId ?? defaultChainId],
      },
    ].filter(({ value }) => value !== undefined),
  ];

  await values.reduce(async (prev, { key, method, value }) => {
    await prev;
    return deployer.execute('Storage', method, [utils.keccak256(utils.toUtf8Bytes(key)), value]);
  }, Promise.resolve(null));
});
module.exports.tags = ['DFH', 'Lite', 'Protocol', 'NonUpgradable'];
