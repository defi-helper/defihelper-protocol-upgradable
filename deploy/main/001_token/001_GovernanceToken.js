const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  await deployer.deploy('contracts/governance/GovernanceToken.sol:GovernanceToken', {
    name: 'GovernanceToken',
    args: [deployer.namedAccounts.deployer.address],
  });
});
module.exports.tags = ['DFH', 'Main', 'Governance', 'NonUpgradable'];
