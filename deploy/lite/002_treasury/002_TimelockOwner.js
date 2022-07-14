const { transferOwnership } = require('../../../scripts/deploy');

module.exports = transferOwnership('GovernorMultisig', 'TreasuryUpgradable');
module.exports.tags = ['DFH', 'Lite', 'GovernanceOwner', 'Upgradable'];
