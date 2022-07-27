const { migration } = require('../../../scripts/deploy');
const bn = require('bignumber.js');

module.exports = migration(async (deployer) => {
  const timelock = await deployer.artifacts.readDeploy('Timelock');
  const governanceToken = await deployer.artifacts.readDeploy('GovernanceToken');
  const governorBravo = await deployer.getContract('GovernorBravo');
  if ((await governorBravo.timelock()) !== '0x0000000000000000000000000000000000000000') {
    return;
  }

  await deployer.execute('GovernorBravo', 'initialize', [
    timelock.address,
    governanceToken.address,
    10, // Voting period - 10 blocks
    1, // Voting delay - 1 block
    new bn(3000000).multipliedBy(new bn(10).pow(18)).toString(10), // Proposal threshold - 3,000,000 DFH
  ]);
});
module.exports.tags = ['DFH', 'Main', 'Governance', 'NonUpgradable'];
