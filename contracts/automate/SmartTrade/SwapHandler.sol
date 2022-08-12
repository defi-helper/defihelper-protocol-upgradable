// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../../Storage.sol";
import {IRouter as IExchange} from "../dex/IRouter.sol";
import "./Router.sol";
import "./IHandler.sol";

contract SmartTradeSwapHandler is IHandler {
  using SafeERC20 for IERC20;

  struct OrderData {
    address exchange;
    uint256 amountIn;
    address[] path;
    uint256 amountOutMin;
  }

  address public router;

  constructor(address _router) {
    require(_router != address(0), "SmartTradeSwapHandler::constructor: invalid router contract address");
    router = _router;
  }

  modifier onlyRouter() {
    require(msg.sender == router, "SmartTradeSwapHandler::onlyRouter: caller is not the router");
    _;
  }

  function callDataEncode(OrderData calldata data) external pure returns (bytes memory) {
    return abi.encode(data);
  }

  function onOrderCreated(SmartTradeRouter.Order calldata order) external view override onlyRouter {
    abi.decode(order.callData, (OrderData));
  }

  function _returnRemainder(address[] memory tokens, address recipient) internal {
    address _router = router; // gas optimization
    for (uint256 i = 0; i < tokens.length; i++) {
      uint256 tokenBalance = IERC20(tokens[i]).balanceOf(address(this));
      if (tokenBalance > 0) {
        IERC20(tokens[i]).safeApprove(_router, tokenBalance);
        SmartTradeRouter(_router).deposit(recipient, tokens[i], tokenBalance);
      }
    }
  }

  function handle(SmartTradeRouter.Order calldata order) external override onlyRouter {
    OrderData memory data = abi.decode(order.callData, (OrderData));

    SmartTradeRouter(router).refund(order.owner, data.path[0], data.amountIn);
    IERC20(data.path[0]).safeApprove(data.exchange, data.amountIn);
    IExchange(data.exchange).swapExactTokensForTokensSupportingFeeOnTransferTokens(
      data.amountIn,
      data.amountOutMin,
      data.path,
      address(this),
      block.timestamp
    );
    _returnRemainder(data.path, order.owner);
  }
}
