const { migration } = require('../../../scripts/deploy');

const priceFeeds = {
  '': '0x0000000000000000000000000000000000000000',
  'main': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
  'ropsten': '0x64125B3eDF8C778c0814A6cd368a133764B1e156',
  'optimistic': '0x13e3Ee699D1909E989722E753853AE30b17e08c5',
  'bsc': '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE',
  'bscTest': '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526',
  'polygon': '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0',
  'moonriver': '0x3f8BFbDc1e79777511c00Ad8591cef888C2113C1',
  'avalancheTest': '0x5498BB86BC934c8D34FDA08E81D444153d0D06aD',
  'avalanche': '0x0A77230d17318075983913bC2145DB16C7366156',
  'mumbai': '0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada',
};

module.exports = migration(async (deployer) => {
  const balance = await deployer.artifacts.readDeploy('Balance');

  let priceFeed = priceFeeds[deployer.hre.network.name];
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
    args: [balance.address, priceFeed],
  });
});
module.exports.tags = ['DFH', 'Lite', 'Protocol', 'NonUpgradable'];
