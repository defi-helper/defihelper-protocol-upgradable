const { migration } = require('../../../scripts/deploy');
const bn = require('bignumber.js');

module.exports = migration(async (deployer) => {
  const products = [
    { id: 1, priceUSD: 10e8 },
    { id: 2, priceUSD: 100e8 },
  ];

  const store = await deployer.getContract('Store');
  await products.reduce(async (prev, { id, priceUSD }) => {
    await prev;
    const currentPrice = await store.products(id).then((v) => new bn(v.toString()));
    if (currentPrice.gt(0)) {
      return null;
    }

    return deployer.execute('Store', 'changeProduct', [id, priceUSD]);
  }, Promise.resolve(null));
});
module.exports.tags = ['DFH', 'Main', 'Protocol', 'Upgradable'];
