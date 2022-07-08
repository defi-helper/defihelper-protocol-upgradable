const { migration } = require('../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const timelock = await deployer.artifacts.readDeploy('Timelock');

  return deployer.transferProxyAdminOwnership(timelock.address);
});
module.exports.tags = ['Test'];
