const { transferOwnership } = require('../../../scripts/deploy');

module.exports = transferOwnership('Timelock', 'BuyLiquidity');
module.exports.tags = ['DFH', 'Main', 'GovernanceOwner', 'NonUpgradable'];
