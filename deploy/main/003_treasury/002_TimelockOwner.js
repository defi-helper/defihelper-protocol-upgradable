const { transferOwnership } = require('../../../scripts/deploy');

module.exports = transferOwnership('Timelock', 'Treasury');
module.exports.tags = ['DFH', 'Main', 'GovernanceOwner', 'NonUpgradable'];
