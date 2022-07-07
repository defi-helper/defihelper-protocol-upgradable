const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const governor = '0x401afFBFAE54260E51da27462e51b27524eaBa4A';
  const governanceToken = await deployer.artifacts.readDeploy('GovernanceToken');

  await deployer.deploy('contracts/governance/Delegator.sol:Delegator', {
    name: 'DelegatorDevelopment',
    args: [governanceToken.address, governor],
  });
});
module.exports.tags = ['DFH', 'Main', 'Protocol', 'NonUpgradable'];
