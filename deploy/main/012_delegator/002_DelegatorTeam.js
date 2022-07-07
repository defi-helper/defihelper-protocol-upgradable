const { migration } = require('../../../scripts/deploy');

module.exports = migration(async (deployer) => {
  const governor = '0x1cBF533BB2A67B0057C93a678433f8370Fd97ebe';
  const governanceToken = await deployer.artifacts.readDeploy('GovernanceToken');

  await deployer.deploy('contracts/governance/Delegator.sol:Delegator', {
    name: 'DelegatorTeam',
    args: [governanceToken.address, governor],
  });
});
module.exports.tags = ['DFH', 'Main', 'Protocol', 'NonUpgradable'];
