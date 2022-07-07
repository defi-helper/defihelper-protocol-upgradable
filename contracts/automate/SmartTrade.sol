// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./dex/IRouter.sol";
import "../ApprovableBalance.sol";

contract SmartTrade is Ownable {
  using EnumerableSet for EnumerableSet.UintSet;

  struct Limit {
    // Target amount out.
    uint256 amountOut;
    // Minimum amount of output token on swap.
    uint256 amountOutMin;
    // Throttle blocks.
    uint256 throttle;
    // Throttle start block number.
    uint256 throttleBlock;
  }

  struct Order {
    // Identificator.
    uint256 id;
    // Customer address.
    address customer;
    // Order amount.
    uint256 amountIn;
    // Swap router.
    address router;
    // Swap path.
    address[] path;
    // Take profit limit.
    Limit takeProfit;
    // Stop loss limit.
    Limit stopLoss;
  }

  /// @notice Balance contract
  ApprovableBalance public balance;

  /// @notice Orders.
  mapping(uint256 => Order) public orders;

  /// @dev Active orders set.
  EnumerableSet.UintSet internal _activeOrders;

  /// @notice Orders count.
  uint256 public ordersCount;

  event BalanceChanged(address indexed balance);

  event OrderCreated(uint256 indexed id, address indexed customer);

  event OrderCanceled(uint256 indexed id);

  event OrderCompleted(uint256 indexed id);

  /**
   * @param _balance Balance contract address.
   */
  constructor(address _balance) {
    balance = ApprovableBalance(_balance);
  }

  /**
   * @notice Change balance contract address.
   * @param _balance New tbalance contract address.
   */
  function changeBalance(address _balance) external onlyOwner {
    balance = ApprovableBalance(_balance);
    emit BalanceChanged(_balance);
  }

  /**
   * @notice Create new order.
   * @param amountIn Order amount in tokens.
   * @param router Used swap router.
   * @param path Swap path.
   * @param takeProfit Take profit limit.
   * @param stopLoss Stop loss limit.
   * @return oid New order identificator.
   */
  function createOrder(
    uint256 amountIn,
    address router,
    address[] memory path,
    Limit memory takeProfit,
    Limit memory stopLoss
  ) external returns (uint256 oid) {
    require(amountIn > 0, "SmartTrader::createOrder: invalid amount in");
    require(router != address(0), "SmartTrader::createOrder: invalid router");
    require(path.length > 1, "SmartTrader::createOrder: invalid path");
    require(takeProfit.amountOut > 0 || stopLoss.amountOut > 0, "SmartTrader::createOrder: empty order");

    oid = ordersCount++;
    orders[oid] = Order(oid, msg.sender, amountIn, router, path, takeProfit, stopLoss);
    _activeOrders.add(oid);
    emit OrderCreated(oid, msg.sender);
  }

  /**
   * @notice Cancel active order.
   * @param oid Target order ID.
   */
  function cancelOrder(uint256 oid) external {
    require(oid < ordersCount, "SmartTrade::cancelOrder: invalid order id");
    require(isActive(oid), "SmartTrade::cancelOrder: order already completed");
    require(orders[oid].customer == msg.sender, "SmartTrade::cancelOrder: only owner can cancel this order");

    _activeOrders.remove(oid);
    emit OrderCanceled(oid);
  }

  function activeOrders() external view returns (uint256[] memory oids) {
    oids = new uint256[](_activeOrders.length());
    for (uint256 i = 0; i < _activeOrders.length(); i++) {
      oids[i] = _activeOrders.at(i);
    }
  }

  /**
   * @param oid Target order id.
   * @return Is order active.
   */
  function isActive(uint256 oid) public view returns (bool) {
    return _activeOrders.contains(oid);
  }

  function _swap(
    Order storage order,
    uint256 amountOutMin,
    uint256 gasFee,
    uint256 protocolFee,
    uint256 deadline
  ) internal {
    balance.claim(order.customer, gasFee, protocolFee);
    _activeOrders.remove(order.id);
    IERC20 tokenIn = IERC20(order.path[0]);
    tokenIn.transferFrom(order.customer, address(this), order.amountIn);
    tokenIn.approve(order.router, order.amountIn);
    IRouter(order.router).swapExactTokensForTokens(order.amountIn, amountOutMin, order.path, order.customer, deadline);
    emit OrderCompleted(order.id);
  }

  function _checkLimit(
    Order storage order,
    Limit storage limit,
    uint256 gasFee,
    uint256 protocolFee,
    uint256 deadline
  ) internal {
    if (limit.throttle > 0) {
      if (limit.throttleBlock == 0) {
        limit.throttleBlock = block.number;
        return balance.claim(order.customer, gasFee, 0);
      } else if (block.number < limit.throttleBlock + limit.throttle) {
        return;
      }
    }
    return _swap(order, limit.amountOutMin, gasFee, protocolFee, deadline);
  }

  function _skipThrottle(
    Order storage order,
    Limit storage limit,
    uint256 gasFee,
    uint256 protocolFee
  ) internal {
    limit.throttleBlock = 0;
    return balance.claim(order.customer, gasFee, protocolFee);
  }

  /**
   * @notice Check order.
   * @param oid Target order ID.
   * @param gasFee Gas fee for this tx.
   * @param protocolFee Protocol fee for this tx.
   * @param deadline Deadline for swap.
   */
  function check(
    uint256 oid,
    uint256 gasFee,
    uint256 protocolFee,
    uint256 deadline
  ) external {
    require(oid < ordersCount, "SmartTrade:check: invalid order id");

    Order storage order = orders[oid];
    require(isActive(oid), "SmartTrade:check: order completed");

    uint256[] memory amountsOut = IRouter(order.router).getAmountsOut(order.amountIn, order.path);
    if (order.takeProfit.amountOut > 0) {
      if (amountsOut[order.path.length - 1] >= order.takeProfit.amountOut) {
        return _checkLimit(order, order.takeProfit, gasFee, protocolFee, deadline);
      } else if (order.takeProfit.throttleBlock > 0) {
        return _skipThrottle(order, order.takeProfit, gasFee, protocolFee);
      }
    }
    if (order.stopLoss.amountOut > 0) {
      if (amountsOut[order.path.length - 1] <= order.stopLoss.amountOut) {
        return _checkLimit(order, order.stopLoss, gasFee, protocolFee, deadline);
      } else if (order.stopLoss.throttleBlock > 0) {
        return _skipThrottle(order, order.stopLoss, gasFee, protocolFee);
      }
    }
  }
}
