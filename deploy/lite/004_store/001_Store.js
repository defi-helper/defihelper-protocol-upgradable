const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const balance = await deployer.artifacts.readDeploy('Balance');
  let { priceFeed } = deployer.namedAccounts;
  if (priceFeed === '0x0000000000000000000000000000000000000000') {
    await deployer.deploy('contracts/mock/PriceFeedMock.sol:PriceFeedMock', {
      name: 'PriceFeedMock',
      args: [8, 'ETH / USD', 3],
    });
    await deployer.execute('PriceFeedMock', 'addRoundData', [50e8]);
    const priceFeedMock = await deployer.artifacts.readDeploy('PriceFeedMock');
    priceFeed = priceFeedMock;
  }

  await deployer.deploy('contracts/Store.sol:Store', {
    name: 'Store',
    args: [balance.address, priceFeed.address],
  });
});
module.exports.tags = ['DFH', 'Lite', 'Protocol', 'NonUpgradable'];
