const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const governorBravo = await deployer.artifacts.readDeploy('GovernorBravo');

  await deployer.deploy('contracts/governance/Timelock.sol:Timelock', {
    name: 'Timelock',
    args: [
      governorBravo.address,
      60 * 2, // 2 minutes delay
    ],
  });
});
module.exports.tags = ['DFH', 'Main', 'Governance', 'NonUpgradable'];
