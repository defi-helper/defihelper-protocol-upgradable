const { migration } = require('../../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const router = await deployer.artifacts.readDeploy('SmartTradeRouter');

  await deployer.deploy('contracts/automate/SmartTrade/SwapHandler.sol:SmartTradeSwapHandler', {
    name: 'SmartTradeSwapHandler',
    args: [router.address],
  });
});
module.exports.tags = ['DFH', 'Dev', 'Protocol', 'NonUpgradable'];
