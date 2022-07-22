const { transferOwnership } = require('../../../scripts/deploy');

module.exports = transferOwnership('Timelock', 'StoreUpgradable');
module.exports.tags = ['DFH', 'Main', 'GovernanceOwner', 'Upgradable'];
