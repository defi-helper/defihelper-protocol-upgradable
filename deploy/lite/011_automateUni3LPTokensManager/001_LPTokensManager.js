const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const storage = await deployer.artifacts.readDeploy('Storage');

  await deployer.deploy('contracts/automate/Uni3/Uni3LPTokensManager.sol:Uni3LPTokensManager', {
    name: 'Uni3LPTokensManager',
    args: [storage.address],
  });
});
module.exports.tags = ['DFH', 'Lite', 'Protocol', 'NonUpgradable'];
