const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  await deployer.deploy('contracts/mock/PriceFeedMock.sol:PriceFeedMock', {
    name: 'NativeTokenPriceFeed',
    args: [8, 'ETH / USD', 4],
  });
});
module.exports.tags = ['DFH', 'Dev', 'Mock', 'NonUpgradable'];
