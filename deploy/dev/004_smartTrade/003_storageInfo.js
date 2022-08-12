const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const handler = await deployer.artifacts.readDeploy('SmartTradeSwapHandler');

  console.info(
    `Storage.setBool("${ethers.utils.solidityKeccak256(
      ['string', 'address'],
      ['DFH:Contract:SmartTrade:allowedHandler:', handler.address],
    )}", 1)`,
  );
  console.info(
    `Storage.setUint("${utils.keccak256(utils.toUtf8Bytes('DFH:Fee:Automate:SmartTrade'))}", 100000000)`
  )
});
module.exports.tags = ['DFH', 'Dev', 'Protocol', 'NonUpgradable'];
