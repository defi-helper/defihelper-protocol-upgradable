const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const governor = '0x9853372055811fA68ba489824dB417EbfF3F3Bdc';
  const governanceToken = await deployer.artifacts.readDeploy('GovernanceToken');

  await deployer.deploy('contracts/governance/Delegator.sol:Delegator', {
    name: 'DelegatorAdvisors',
    args: [governanceToken.address, governor],
  });
});
module.exports.tags = ['DFH', 'Main', 'Protocol', 'NonUpgradable'];
