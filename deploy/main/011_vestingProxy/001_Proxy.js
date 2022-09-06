const { migration } = require('../../../scripts/deploy');
const { ethers } = require('hardhat');

module.exports = migration(async (deployer) => {
  const [vesting, gov, timelock] = await Promise.all([
    deployer.artifacts.readDeploy('Vesting'),
    deployer.artifacts.readDeploy('GovernanceToken'),
    deployer.artifacts.readDeploy('Timelock'),
  ]);

  const receipt = await deployer.execute(
    'ProxyFactory',
    'create',
    [
      vesting.address,
      new ethers.utils.Interface(vesting.abi).encodeFunctionData('init', [timelock.address, gov.address, timelock.address]),
    ],
    { gasLimit: 150000 },
  );

  const createEvent = receipt.events.find(({ event }) => event === 'ProxyCreated');
  if (!createEvent) return;
  const { proxy } = createEvent.args;
  console.log('Proxy address: ', proxy);
});
module.exports.tags = ['DFH', 'Main', 'Protocol', 'NonUpgradable'];
