const { transferOwnership } = require('../../../scripts/deploy');

module.exports = transferOwnership('Timelock', 'BalanceUpgradable');
module.exports.tags = ['DFH', 'Main', 'GovernanceOwner', 'Upgradable'];
