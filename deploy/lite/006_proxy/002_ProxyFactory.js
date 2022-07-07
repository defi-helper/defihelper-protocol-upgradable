const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const erc1167 = await deployer.artifacts.readDeploy('ERC1167');
  await deployer.deploy('contracts/proxy/ProxyFactory.sol:ProxyFactory', {
    name: 'ProxyFactory',
    libraries: {
      ERC1167: erc1167.address,
    },
  });
});
module.exports.tags = ['DFH', 'Lite', 'Protocol', 'NonUpgradable'];
