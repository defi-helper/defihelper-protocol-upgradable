const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  await deployer.deploy('contracts/investments/Option.sol:Option', {
    name: 'Option',
  });
});
module.exports.tags = ['DFH', 'Main', 'Protocol', 'NonUpgradable'];
