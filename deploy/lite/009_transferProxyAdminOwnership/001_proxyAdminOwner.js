const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const governorMultisig = await deployer.artifacts.readDeploy('GovernorMultisig');

  return deployer.transferProxyAdminOwnership(governorMultisig.address);
});
module.exports.tags = ['DFH', 'Lite', 'GovernanceOwner', 'Upgradable'];
