const { transferOwnership } = require('../../../scripts/deploy');

module.exports = transferOwnership('Timelock', 'LPTokensManager');
module.exports.tags = ['DFH', 'Main', 'GovernanceOwner', 'NonUpgradable'];
