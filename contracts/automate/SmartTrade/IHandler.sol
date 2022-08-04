// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.6;

import "./Router.sol";

interface IHandler {
  function onOrderCreated(Router.Order calldata order) external;

  function handle(Router.Order calldata order) external;
}
