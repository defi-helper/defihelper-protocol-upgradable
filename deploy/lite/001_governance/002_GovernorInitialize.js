const { migration } = require('../../../scripts/deploy');
const hardhat = require('hardhat');

module.exports = migration(async (deployer) => {
  const owners = JSON.parse(process.env[`${hardhat.network.name}_MULTISIG`] ?? '[]');
  if (owners.length === 0) throw new Error('Invalid owners count');

  const howManyOwnersDecide = Math.floor(owners.length * 0.75);
  await deployer.execute('GovernorMultisig', 'transferOwnershipWithHowMany', [
    owners,
    howManyOwnersDecide >= 1 ? howManyOwnersDecide : 1,
  ]);
});
module.exports.tags = ['DFH', 'Lite', 'Governance', 'NonUpgradable'];
