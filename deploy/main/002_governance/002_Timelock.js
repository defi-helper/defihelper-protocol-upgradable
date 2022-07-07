const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const governorBravo = await deployer.artifacts.readDeploy('GovernorBravo');

  await deployer.deploy('contracts/governance/Timelock.sol:Timelock', {
    name: 'Timelock',
    args: [
      governorBravo.address,
      2 * 24 * 60 * 60, // 2 days delay
    ],
  });
});
module.exports.tags = ['DFH', 'Main', 'Governance', 'NonUpgradable'];
