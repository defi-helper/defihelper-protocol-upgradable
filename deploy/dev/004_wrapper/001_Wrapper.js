const { migration } = require('../../../scripts/deploy');
const BN = require('bignumber.js');

module.exports = migration(async (deployer) => {
  await deployer.deploy('contracts/interfaces/NativeWrapper/mock/WrapMock.sol:WrapMock', {
    name: 'WETHMock',
    args: ['Wrapped ETH', 'WETH', new BN('1000000e18').toFixed(0)],
  });
});
module.exports.tags = ['DFH', 'Dev', 'Mock', 'NonUpgradable'];
