const { transferOwnership } = require('../../../../scripts/deploy');

module.exports = transferOwnership('GovernorMultisig', 'SmartTradeRouter');

module.exports.tags = ['DFH', 'Lite', 'GovernanceOwner', 'NonUpgradable'];
