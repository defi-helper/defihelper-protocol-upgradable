const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const { inspector } = deployer.namedAccounts;
  const balance = await deployer.getContract('BalanceUpgradable');
  const inspectors = await balance.inspectors();

  if (!inspectors.includes(inspector)) {
    await deployer.execute('BalanceUpgradable', 'addInspector', [inspector.address]);
  }
});
module.exports.tags = ['DFH', 'Lite', 'Protocol', 'NonUpgradable'];
