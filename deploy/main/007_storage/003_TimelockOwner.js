const { transferOwnership } = require('../../../scripts/deploy');

module.exports = transferOwnership('Timelock', 'Storage');
module.exports.tags = ['DFH', 'Main', 'GovernanceOwner', 'NonUpgradable'];
