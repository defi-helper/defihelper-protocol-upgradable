// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// solhint-disable avoid-tx-origin
contract ApprovableBalance is Ownable {
  using EnumerableSet for EnumerableSet.AddressSet;

  /// @notice Maximum consumer count.
  uint256 public constant MAXIMUM_CONSUMER_COUNT = 100;

  /// @notice Payable token.
  IERC20 public token;

  /// @notice Treasury contract
  address public treasury;

  /// @dev Consumers list.
  EnumerableSet.AddressSet internal _consumers;

  event TokenChanged(address indexed token);

  event TreasuryChanged(address indexed treasury);

  event Claim(address indexed account, uint256 gasFee, uint256 protocolFee);

  event ConsumerAdded(address indexed consumer);

  event ConsumerRemoved(address indexed consumer);

  constructor(address _token, address _treasury) {
    token = IERC20(_token);
    treasury = _treasury;
  }

  /**
   * @notice Change payable token address.
   * @param _token New payable token address.
   */
  function changeToken(address _token) external onlyOwner {
    token = IERC20(_token);
    emit TokenChanged(_token);
  }

  /**
   * @notice Change treasury contract address.
   * @param _treasury New treasury contract address.
   */
  function changeTreasury(address _treasury) external onlyOwner {
    treasury = _treasury;
    emit TreasuryChanged(treasury);
  }

  /**
   * @notice Add consumer.
   * @param consumer Added consumer.
   */
  function addConsumer(address consumer) external onlyOwner {
    require(!_consumers.contains(consumer), "ApprovableBalance::addConsumer: consumer already added");
    require(
      _consumers.length() < MAXIMUM_CONSUMER_COUNT,
      "ApprovableBalance::addConsumer: consumer must not exceed maximum count"
    );

    _consumers.add(consumer);

    emit ConsumerAdded(consumer);
  }

  /**
   * @notice Remove consumer.
   * @param consumer Removed consumer.
   */
  function removeConsumer(address consumer) external onlyOwner {
    require(_consumers.contains(consumer), "ApprovableBalance::removeConsumer: consumer already removed");

    _consumers.remove(consumer);

    emit ConsumerRemoved(consumer);
  }

  /**
   * @notice Get all consumers.
   * @return All consumers addresses.
   */
  function consumers() external view returns (address[] memory) {
    address[] memory result = new address[](_consumers.length());

    for (uint256 i = 0; i < _consumers.length(); i++) {
      result[i] = _consumers.at(i);
    }

    return result;
  }

  /**
   * @notice Send claim.
   * @param account Target account.
   * @param gasFee Claim gas fee.
   * @param protocolFee Claim protocol fee.
   */
  function claim(
    address account,
    uint256 gasFee,
    uint256 protocolFee
  ) external {
    if (tx.origin == account) return;
    require(_consumers.contains(tx.origin), "ApprovableBalance: caller is not a consumer");

    uint256 amount = gasFee + protocolFee;
    require(amount > 0, "ApprovableBalance::claim: negative or zero claim");

    token.transferFrom(account, treasury, amount);
    emit Claim(account, gasFee, protocolFee);
  }
}
