const { migration } = require('../../../scripts/deploy');

module.exports = migration((deployer) => {
  return deployer.deployProxy('contracts/Treasury/TreasuryV1.sol:TreasuryV1', {
    name: 'TreasuryUpgradable',
  });
});
module.exports.tags = ['DFH', 'Lite', 'Protocol', 'Upgradable'];
