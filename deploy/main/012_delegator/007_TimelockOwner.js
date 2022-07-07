const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const timelock = await deployer.artifacts.readDeploy('Timelock');
  const [development, team, marketing, earlyEcosystem, advisors, liquidity] = await Promise.all([
    deployer.getContract('DelegatorDevelopment'),
    deployer.getContract('DelegatorTeam'),
    deployer.getContract('DelegatorMarketing'),
    deployer.getContract('DelegatorEarlyEcosystem'),
    deployer.getContract('DelegatorAdvisors'),
    deployer.getContract('DelegatorLiquidity'),
  ]);
  if ((await development.owner()) !== timelock.address) {
    await deployer.execute('DelegatorDevelopment', 'transferOwnership', [timelock.address]);
  }
  if ((await team.owner()) !== timelock.address) {
    await deployer.execute('DelegatorTeam', 'transferOwnership', [timelock.address]);
  }
  if ((await marketing.owner()) !== timelock.address) {
    await deployer.execute('DelegatorMarketing', 'transferOwnership', [timelock.address]);
  }
  if ((await earlyEcosystem.owner()) !== timelock.address) {
    await deployer.execute('DelegatorEarlyEcosystem', 'transferOwnership', [timelock.address]);
  }
  if ((await advisors.owner()) !== timelock.address) {
    await deployer.execute('DelegatorAdvisors', 'transferOwnership', [timelock.address]);
  }
  if ((await liquidity.owner()) !== timelock.address) {
    await deployer.execute('DelegatorLiquidity', 'transferOwnership', [timelock.address]);
  }
});
module.exports.tags = ['DFH', 'Main', 'GovernanceOwner', 'NonUpgradable'];
