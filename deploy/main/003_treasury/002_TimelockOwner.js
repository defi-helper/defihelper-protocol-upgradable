const { transferOwnership } = require('../../../scripts/deploy');

module.exports = transferOwnership('Timelock', 'TreasuryUpgradable');
module.exports.tags = ['DFH', 'Main', 'GovernanceOwner', 'Upgradable'];
