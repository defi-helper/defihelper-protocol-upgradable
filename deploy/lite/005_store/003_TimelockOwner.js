const { transferOwnership } = require('../../../scripts/deploy');

module.exports = transferOwnership('GovernorMultisig', 'Store');
module.exports.tags = ['DFH', 'Lite', 'GovernanceOwner', 'NonUpgradable'];
