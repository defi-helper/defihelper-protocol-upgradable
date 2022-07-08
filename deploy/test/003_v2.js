const { migration } = require('../../scripts/deploy');

module.exports = migration((deployer) => {
  return deployer.deployProxyImplementation('TreasuryUpgradable', 'contracts/Treasury/TreasuryV2.sol:TreasuryV2');
});
module.exports.tags = ['Test'];
