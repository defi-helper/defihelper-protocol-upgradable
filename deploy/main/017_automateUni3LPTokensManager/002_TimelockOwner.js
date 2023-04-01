const { transferOwnership } = require('../../../scripts/deploy');

module.exports = transferOwnership('Timelock', 'Uni3LPTokensManager');

module.exports.tags = ['DFH', 'Main', 'GovernanceOwner', 'NonUpgradable'];
