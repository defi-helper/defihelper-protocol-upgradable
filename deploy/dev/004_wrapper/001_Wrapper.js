const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  await deployer.deploy('contracts/interfaces/NativeWrapper/mock/WrapMock.sol:WrapMock', {
    name: 'WETHMock',
    args: ['Wrapped ETH', 'WETH'],
  });
});
module.exports.tags = ['DFH', 'Dev', 'Mock', 'NonUpgradable'];
