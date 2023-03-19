const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const storage = await deployer.artifacts.readDeploy('Storage');

  await deployer.deploy('contracts/automate/Uni3/LPTokensManager.sol:LPTokensManager', {
    name: 'Uni3LPTokensManager',
    args: [storage.address],
  });
});
module.exports.tags = ['DFH', 'Lite', 'Protocol', 'NonUpgradable'];
