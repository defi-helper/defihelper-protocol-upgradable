const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  await deployer.deploy('contracts/proxy/ERC1167.sol:ERC1167', {
    name: 'ERC1167',
  });
});
module.exports.tags = ['DFH', 'Main', 'Protocol', 'NonUpgradable'];
