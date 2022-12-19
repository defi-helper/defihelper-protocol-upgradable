const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const storage = await deployer.artifacts.readDeploy('Storage');

  await deployer.deployProxy('contracts/Store/StoreV3.sol:StoreV3', {
    name: 'StoreUpgradable',
    args: [storage.address],
  });
});
module.exports.tags = ['DFH', 'Lite', 'Protocol', 'Upgradable'];
