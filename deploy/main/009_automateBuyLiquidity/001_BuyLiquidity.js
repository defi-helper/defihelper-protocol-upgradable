const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const [storage, treasury] = await Promise.all([
    deployer.artifacts.readDeploy('Storage'),
    deployer.artifacts.readDeploy('Treasury'),
  ]);
  const { priceFeed } = deployer.namedAccounts;

  await deployer.deploy('contracts/automate/BuyLiquidity.sol:BuyLiquidity', {
    name: 'BuyLiquidity',
    args: [storage.address, treasury.address, priceFeed.address],
  });
});
module.exports.tags = ['DFH', 'Main', 'Protocol', 'NonUpgradable'];
