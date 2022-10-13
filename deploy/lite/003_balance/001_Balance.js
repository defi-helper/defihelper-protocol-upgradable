const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const treasury = await deployer.artifacts.readDeploy('TreasuryUpgradable');

  await deployer.deployProxy('contracts/Balance/BalanceV1.sol:BalanceV1', {
    name: 'BalanceUpgradable',
    args: [treasury.address],
  });
});
module.exports.tags = ['DFH', 'Lite', 'Protocol', 'NonUpgradable'];
