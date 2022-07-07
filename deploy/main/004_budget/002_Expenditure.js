const { migration } = require('../../../scripts/deploy');
const bn = require('bignumber.js');

module.exports = migration(async (deployer) => {
  const { consumer1, consumer2, consumer3, inspector } = deployer.namedAccounts;
  const expenditures = [
    { recipient: inspector, min: 1e18, target: 3e18 },
    { recipient: consumer1, min: 1e18, target: 3e18 },
    { recipient: consumer2, min: 1e18, target: 3e18 },
    { recipient: consumer3, min: 1e18, target: 3e18 },
  ];

  const budget = await deployer.getContract('Budget');
  await expenditures.reduce(async (prev, { recipient, min, target }) => {
    await prev;
    const currentExpenditure = await budget
      .expenditures(recipient.address)
      .then(({ target }) => new bn(target.toString()));
    if (currentExpenditure.gt(0)) {
      return null;
    }

    return deployer.execute('Budget', 'changeExpenditure', [recipient.address, min.toString(), target.toString()]);
  }, Promise.resolve(null));
});
module.exports.tags = ['DFH', 'Main', 'Protocol', 'NonUpgradable'];
