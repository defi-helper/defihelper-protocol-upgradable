const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  await deployer.deploy('contracts/investments/Vesting.sol:Vesting', {
    name: 'Vesting',
  });
});
module.exports.tags = ['DFH', 'Main', 'Protocol', 'NonUpgradable'];
