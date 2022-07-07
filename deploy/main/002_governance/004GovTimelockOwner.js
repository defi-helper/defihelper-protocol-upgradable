const { transferOwnership } = require('../../../scripts/deploy');

module.exports = transferOwnership('Timelock', 'GovernanceToken');
module.exports.tags = ['DFH', 'Main', 'GovernanceOwner', 'NonUpgradable'];
