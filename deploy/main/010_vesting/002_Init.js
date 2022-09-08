const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const [gov, timelock] = await Promise.all([
    deployer.artifacts.readDeploy('GovernanceToken'),
    deployer.artifacts.readDeploy('Timelock'),
  ]);

  await deployer.execute('Vesting', 'init', [timelock.address, gov.address, timelock.address]);
});
module.exports.tags = ['DFH', 'Main', 'Protocol', 'NonUpgradable'];
