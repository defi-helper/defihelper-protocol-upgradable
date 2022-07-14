const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const storage = await deployer.artifacts.readDeploy('Storage');

  await deployer.deploy('contracts/automate/LPTokensManager.sol:LPTokensManager', {
    name: 'LPTokensManager',
    args: [storage.address],
  });
});
module.exports.tags = ['DFH', 'Lite', 'Protocol', 'NonUpgradable'];
