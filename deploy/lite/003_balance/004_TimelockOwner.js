const { transferOwnership } = require('../../../scripts/deploy');

module.exports = transferOwnership('GovernorMultisig', 'BalanceUpgradable');
module.exports.tags = ['DFH', 'Lite', 'GovernanceOwner', 'NonUpgradable'];
