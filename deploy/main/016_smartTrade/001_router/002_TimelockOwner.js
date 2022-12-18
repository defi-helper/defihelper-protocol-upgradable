const { transferOwnership } = require('../../../../scripts/deploy');

module.exports = transferOwnership('Timelock', 'SmartTradeRouter');

module.exports.tags = ['DFH', 'Main', 'GovernanceOwner', 'NonUpgradable'];
