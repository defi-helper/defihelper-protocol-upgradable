// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "../../Storage.sol";
import "../../Balance.sol";
import "./IHandler.sol";

contract Router is Ownable, Pausable {
  using SafeERC20 for IERC20;

  enum OrderStatus {
    Pending,
    Succeeded,
    Canceled
  }

  struct Order {
    uint256 id;
    address owner;
    OrderStatus status;
    address handler;
    bytes callData;
  }

  /// @notice Storage contract
  Storage public info;

  mapping(address => mapping(address => uint256)) internal _balances;

  mapping(uint256 => Order) internal _orders;

  uint256 public ordersCount;

  event StorageChanged(address indexed info);

  event HandlerAdded(address indexed handler);

  event HandlerRemoved(address indexed handler);

  event OrderCreated(uint256 indexed id, address indexed owner, address indexed handler);

  event OrderCanceled(uint256 indexed id);

  event OrderSuccessed(uint256 indexed id);

  constructor(address _info) {
    require(_info != address(0), "Router::constructor: invalid storage contract address");

    info = Storage(_info);
  }

  function pause() external {
    address pauser = info.getAddress(keccak256("DFH:Pauser"));
    require(msg.sender == owner() || msg.sender == pauser, "Router::pause: caller is not the owner or pauser");
    _pause();
  }

  function unpause() external {
    address pauser = info.getAddress(keccak256("DFH:Pauser"));
    require(msg.sender == owner() || msg.sender == pauser, "Router::unpause: caller is not the owner or pauser");
    _unpause();
  }

  /**
   * @notice Change storage contract address.
   * @param _info New storage contract address.
   */
  function changeStorage(address _info) external onlyOwner {
    require(_info != address(0), "Router::changeStorage: invalid storage contract address");

    info = Storage(_info);
    emit StorageChanged(_info);
  }

  /**
   * @return Current protocol commission.
   */
  function fee() public view returns (uint256) {
    uint256 feeUSD = info.getUint(keccak256("DFH:Fee:Automate:SmartTrade"));
    if (feeUSD == 0) return 0;

    (, int256 answer, , , ) = AggregatorV3Interface(info.getAddress(keccak256("DFH:Fee:PriceFeed"))).latestRoundData();
    require(answer > 0, "Router::fee: invalid price feed response");

    return (feeUSD * 1e18) / uint256(answer);
  }

  function balanceOf(address account, address token) public view returns (uint256) {
    return _balances[account][token];
  }

  function deposit(
    address recipient,
    address token,
    uint256 amount
  ) public whenNotPaused {
    require(recipient != address(0), "Router::deposit: invalid recipient address");
    require(token != address(0), "Router::deposit: invalid token contract address");
    require(amount > 0, "Router::deposit: invalid amount");

    IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    _balances[recipient][token] += amount;
  }

  function refund(
    address spender,
    address token,
    uint256 amount
  ) external whenNotPaused {
    require(spender != address(0), "Router::refund: invalid recipient address");
    require(
      spender == msg.sender ||
        info.getBool(keccak256(abi.encodePacked("DFH:Contract:SmartTrade:allowedHandler:", msg.sender)))
    );
    require(token != address(0), "Router::refund: invalid token contract address");
    require(amount > 0, "Router::refund: invalid amount");
    require(balanceOf(spender, token) >= amount, "Router::refund: insufficient balance");

    _balances[spender][token] -= amount;
    IERC20(token).safeTransfer(msg.sender, amount);
  }

  function order(uint256 id) public view returns (Order memory) {
    return _orders[id];
  }

  function createOrder(
    address handler,
    bytes calldata callData,
    address token,
    uint256 amount
  ) external payable whenNotPaused returns (uint256) {
    require(
      info.getBool(keccak256(abi.encodePacked("DFH:Contract:SmartTrade:allowedHandler:", handler))),
      "Router::createOrder: invalid handler address"
    );

    ordersCount++;
    Order storage newOrder = _orders[ordersCount];
    newOrder.id = ordersCount;
    newOrder.owner = msg.sender;
    newOrder.status = OrderStatus.Pending;
    newOrder.handler = handler;
    newOrder.callData = callData;
    emit OrderCreated(newOrder.id, newOrder.owner, newOrder.handler);
    IHandler(newOrder.handler).onOrderCreated(newOrder);

    if (token != address(0) && amount > 0) {
      deposit(newOrder.owner, token, amount);
    }

    if (msg.value > 0) {
      address balance = info.getAddress(keccak256("DFH:Contract:Balance"));
      require(balance != address(0), "Router::createOrder: invalid balance contract address");

      Balance(balance).deposit{value: msg.value}(newOrder.owner);
    }

    return newOrder.id;
  }

  function cancelOrder(uint256 id) external {
    Order storage _order = _orders[id];
    require(_order.owner != address(0), "Router::cancelOrder: undefined order");
    require(msg.sender == _order.owner || msg.sender == owner(), "Router::cancelOrder: forbidden");
    require(_order.status == OrderStatus.Pending, "Router::cancelOrder: order has already been processed");

    _order.status = OrderStatus.Canceled;
    emit OrderCanceled(_order.id);
  }

  function handleOrder(uint256 id, uint256 gasFee) external whenNotPaused {
    Order storage _order = _orders[id];
    require(_order.owner != address(0), "Router::handleOrder: undefined order");
    require(_order.status == OrderStatus.Pending, "Router::handleOrder: order has already been processed");

    // solhint-disable-next-line avoid-tx-origin
    if (tx.origin != _order.owner) {
      address balance = info.getAddress(keccak256("DFH:Contract:Balance"));
      require(balance != address(0), "Router::handleOrder: invalid balance contract address");
      Balance(balance).claim(_order.owner, gasFee, fee(), "SmartTradeHandle");
    }

    IHandler(_order.handler).handle(_order);
    _order.status = OrderStatus.Succeeded;
    emit OrderSuccessed(id);
  }
}
