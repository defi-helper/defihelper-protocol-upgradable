const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const treasury = await deployer.artifacts.readDeploy('TreasuryUpgradable');

  await deployer.deploy('contracts/Balance.sol:Balance', {
    name: 'Balance',
    args: [treasury.address],
  });
});
module.exports.tags = ['DFH', 'Main', 'Protocol', 'NonUpgradable'];
