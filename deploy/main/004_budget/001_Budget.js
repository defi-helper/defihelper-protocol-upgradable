const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  await deployer.deploy('contracts/Budget.sol:Budget', {
    name: 'Budget',
  });
});
module.exports.tags = ['DFH', 'Main', 'Protocol', 'NonUpgradable'];
