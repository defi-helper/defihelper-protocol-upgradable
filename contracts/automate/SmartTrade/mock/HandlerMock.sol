// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../Router.sol";
import "../IHandler.sol";

contract SmartTradeHandlerMock is IHandler {
  using SafeERC20 for IERC20;

  struct OrderData {
    address tokenIn;
    address tokenOut;
    uint256 amountIn;
    uint256 amountOut;
  }

  address public router;

  constructor(address _router) {
    require(_router != address(0), "SmartTradeHandlerMock::constructor: invalid router contract address");
    router = _router;
  }

  modifier onlyRouter() {
    require(msg.sender == router, "SmartTradeHandlerMock::onlyRouter: caller is not the router");
    _;
  }

  function callDataEncode(OrderData calldata data) external pure returns (bytes memory) {
    return abi.encode(data);
  }

  function onOrderCreated(SmartTradeRouter.Order calldata order) external view override onlyRouter {
    abi.decode(order.callData, (OrderData));
  }

  function handle(SmartTradeRouter.Order calldata order, bytes calldata) external override onlyRouter {
    OrderData memory data = abi.decode(order.callData, (OrderData));
    address _router = router;

    address[] memory refundTokens = new address[](1);
    refundTokens[0] = data.tokenIn;
    uint256[] memory refundAmounts = new uint256[](1);
    refundAmounts[0] = data.amountIn;
    SmartTradeRouter(_router).refund(order.id, refundTokens, refundAmounts, address(this));

    address[] memory depositTokens = new address[](1);
    depositTokens[0] = data.tokenOut;
    uint256[] memory depositAmounts = new uint256[](1);
    depositAmounts[0] = data.amountOut;
    IERC20(data.tokenOut).safeApprove(_router, data.amountOut);
    SmartTradeRouter(_router).deposit(order.id, depositTokens, depositAmounts);
  }
}
