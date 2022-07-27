const { migration } = require('../../../scripts/deploy');

module.exports = migration((deployer) => {
  return deployer.deployProxy('contracts/Treasury/TreasuryV2.sol:TreasuryV2', {
    name: 'TreasuryUpgradable',
  });
});
module.exports.tags = ['DFH', 'Lite', 'Protocol', 'Upgradable'];
