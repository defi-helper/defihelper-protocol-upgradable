const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  await deployer.deployProxyImplementation('StoreUpgradable', 'contracts/Store/StoreV3.sol:StoreV3');
});
module.exports.tags = ['DFH', 'Lite', 'Protocol', 'Upgradable'];
