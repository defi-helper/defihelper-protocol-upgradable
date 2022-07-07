const { transferOwnership } = require('../../../scripts/deploy');

module.exports = transferOwnership('Timelock', 'Budget');
module.exports.tags = ['DFH', 'Main', 'GovernanceOwner', 'NonUpgradable'];
