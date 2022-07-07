const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  await deployer.deploy('contracts/governance/GovernorBravo.sol:GovernorBravo', {
    name: 'GovernorBravo',
  });
});
module.exports.tags = ['DFH', 'Main', 'Governance', 'NonUpgradable'];
