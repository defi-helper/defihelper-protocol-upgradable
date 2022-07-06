const { migration } = require("../../../scripts/deploy");

module.exports = migration((deployer) => {
  return deployer.deployProxy("contracts/Treasury/TreasuryV1.sol:TreasuryV1", {
    name: "Treasury",
  });
});
module.exports.tags = ["DFH", "TreasuryV1"];
