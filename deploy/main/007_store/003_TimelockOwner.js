const { transferOwnership } = require('../../../scripts/deploy');

module.exports = transferOwnership('Timelock', 'Store');
module.exports.tags = ['DFH', 'Main', 'GovernanceOwner', 'Upgradable'];
