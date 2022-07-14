const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const [storage, treasury] = await Promise.all([
    deployer.artifacts.readDeploy('Storage'),
    deployer.artifacts.readDeploy('Treasury'),
  ]);
  const { priceFeed } = deployer.namedAccounts;

  await deployer.deploy('contracts/automate/LPTokensManager.sol:LPTokensManager', {
    name: 'LPTokensManager',
    args: [storage.address, priceFeed.address],
  });
});
module.exports.tags = ['DFH', 'Main', 'Protocol', 'NonUpgradable'];
