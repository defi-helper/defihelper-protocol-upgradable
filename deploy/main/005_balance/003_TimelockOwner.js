const { transferOwnership } = require('../../../scripts/deploy');

module.exports = transferOwnership('Timelock', 'Balance');
module.exports.tags = ['DFH', 'Main', 'GovernanceOwner', 'NonUpgradable'];
