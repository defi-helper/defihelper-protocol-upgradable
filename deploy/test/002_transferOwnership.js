const { transferOwnership } = require('../../scripts/deploy');

module.exports = transferOwnership('GovernorMultisig', 'Storage');
module.exports.tags = ['Test'];
