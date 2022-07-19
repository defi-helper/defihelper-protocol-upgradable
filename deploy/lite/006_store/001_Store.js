const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const storage = await deployer.artifacts.readDeploy('Storage');

  await deployer.deployProxy('contracts/Store/StoreV1.sol:Store', {
    name: 'Store',
    args: [storage.address],
  });
});
module.exports.tags = ['DFH', 'Lite', 'Protocol', 'Upgradable'];
