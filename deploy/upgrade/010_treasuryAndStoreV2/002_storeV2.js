const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  await deployer.deployProxyImplementation('StoreUpgradable', 'contracts/Store/StoreV2.sol:StoreV2');
});
module.exports.tags = ['DFH', 'Lite', 'Protocol', 'Upgradable'];
