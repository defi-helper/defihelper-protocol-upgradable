const { migration } = require('../../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const storage = await deployer.artifacts.readDeploy('Storage');

  await deployer.deploy('contracts/automate/SmartTrade/Router.sol:SmartTradeRouter', {
    name: 'SmartTradeRouter',
    args: [storage.address],
  });
});
module.exports.tags = ['DFH', 'Dev', 'Protocol', 'NonUpgradable'];
