const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const { consumer1, consumer2, consumer3 } = deployer.namedAccounts;
  const balance = await deployer.getContract('BalanceUpgradable');
  const consumers = await balance.consumers();

  if (!consumers.includes(consumer1)) {
    await deployer.execute('BalanceUpgradable', 'addConsumer', [consumer1.address]);
  }
  if (!consumers.includes(consumer2)) {
    await deployer.execute('BalanceUpgradable', 'addConsumer', [consumer2.address]);
  }
  if (!consumers.includes(consumer3)) {
    await deployer.execute('BalanceUpgradable', 'addConsumer', [consumer3.address]);
  }
});
module.exports.tags = ['DFH', 'Main', 'Protocol', 'Upgradable'];
