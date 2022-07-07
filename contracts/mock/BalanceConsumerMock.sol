// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.6;

import "../Balance.sol";

contract BalanceConsumerMock {
  Balance public balance;

  constructor(address _balance) {
    balance = Balance(_balance);
  }

  function consume(
    address account,
    uint256 gasFee,
    uint256 protocolFee,
    string memory description
  ) external {
    balance.claim(account, gasFee, protocolFee, description);
  }
}
