const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  await deployer.deployProxyImplementation('TreasuryUpgradable', 'contracts/Treasury/TreasuryV2.sol:TreasuryV2');
});
module.exports.tags = ['DFH', 'Lite', 'Protocol', 'Upgradable'];
