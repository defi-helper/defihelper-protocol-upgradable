const { transferOwnership } = require('../../../scripts/deploy');

module.exports = transferOwnership('GovernorMultisig', 'Uni3LPTokensManager');
module.exports.tags = ['DFH', 'Lite', 'GovernanceOwner', 'NonUpgradable'];
