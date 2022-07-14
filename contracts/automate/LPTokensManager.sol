// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../Storage.sol";
import "./dex/IPair.sol";
import "./dex/IRouter.sol";

interface IPriceFeed {
  function latestRoundData()
    external
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    );
}

contract LPTokensManager is Ownable {
  using SafeERC20 for IERC20;

  /// @notice Storage contract
  Storage public info;

  /// @notice Fee token to USD price feed contract
  IPriceFeed public priceFeed;

  struct Swap {
    address[] path;
    uint256 outMin;
  }

  event StorageChanged(address indexed info);

  event PriceFeedChanged(address indexed priceFeed);

  constructor(address _info, address _priceFeed) {
    info = Storage(_info);
    priceFeed = IPriceFeed(_priceFeed);
  }

  /**
   * @notice Change storage contract address.
   * @param _info New storage contract address.
   */
  function changeStorage(address _info) external onlyOwner {
    info = Storage(_info);
    emit StorageChanged(_info);
  }

  /**
   * @notice Change price feed contract address.
   * @param _priceFeed New price feed contract address.
   */
  function changePrireFeed(address _priceFeed) external onlyOwner {
    priceFeed = IPriceFeed(_priceFeed);
    emit PriceFeedChanged(_priceFeed);
  }

  function _swap(
    address router,
    uint256 amount,
    uint256 outMin,
    address[] memory path,
    uint256 deadline
  ) internal {
    if (path[0] == path[path.length - 1]) return;

    IRouter(router).swapExactTokensForTokensSupportingFeeOnTransferTokens(
      amount,
      outMin,
      path,
      address(this),
      deadline
    );
  }

  /**
   * @return Current call commission.
   */
  function fee() public view returns (uint256) {
    uint256 feeUSD = info.getUint(keccak256("DFH:Fee:Automate:LPTokensManager"));
    if (feeUSD == 0) return 0;

    (, int256 answer, , , ) = priceFeed.latestRoundData();
    require(answer > 0, "LPTokensManager::fee: invalid fee token price");

    return (feeUSD * (10**18)) / uint256(answer);
  }

  function _payCommission() internal {
    uint256 payFee = fee();
    if (payFee == 0) return;
    require(msg.value >= payFee, "LPTokensManager::_payCommission: insufficient funds to pay commission");
    payable(info.getAddress(keccak256("DFH:Contract:Treasury"))).transfer(payFee);
    if (msg.value > payFee) {
      payable(msg.sender).transfer(msg.value - payFee);
    }
  }

  function _returnRemainder(address[3] memory tokens) internal {
    for (uint256 i = 0; i < tokens.length; i++) {
      uint256 tokenBalance = IERC20(tokens[i]).balanceOf(address(this));
      if (tokenBalance > 0) {
        IERC20(tokens[i]).safeTransfer(msg.sender, tokenBalance);
      }
    }
  }

  function _approve(
    IERC20 token,
    address spender,
    uint256 amount
  ) internal {
    if (token.allowance(address(this), spender) != 0) {
      token.safeApprove(spender, 0);
    }
    token.safeApprove(spender, amount);
  }

  function buyLiquidity(
    uint256 amount,
    address router,
    Swap memory swap0,
    Swap memory swap1,
    IPair to,
    uint256 deadline
  ) external payable {
    require(
      info.getBool(keccak256(abi.encodePacked("DFH:Contract:LPTokensManager:allowedRouter:", router))),
      "LPTokensManager::buyLiquidity: invalid router address"
    );
    require(swap0.path[0] == swap1.path[0], "LPTokensManager::buyLiqudity: start token not equals");

    _payCommission();

    // Get tokens in
    address token0 = to.token0();
    require(swap0.path[swap0.path.length - 1] == token0, "LPTokensManager::buyLiqudity: invalid token0");
    address token1 = to.token1();
    require(swap1.path[swap1.path.length - 1] == token1, "LPTokensManager::buyLiqudity: invalid token1");

    // Swap tokens
    IERC20(swap0.path[0]).safeTransferFrom(msg.sender, address(this), amount);
    _approve(IERC20(swap0.path[0]), router, amount);
    uint256 amount0In = amount / 2;
    _swap(router, amount0In, swap0.outMin, swap0.path, deadline);
    uint256 amount1In = amount - amount0In;
    _swap(router, amount1In, swap1.outMin, swap1.path, deadline);

    // Add liquidity
    amount0In = IERC20(token0).balanceOf(address(this));
    amount1In = IERC20(token1).balanceOf(address(this));
    _approve(IERC20(token0), router, amount0In);
    _approve(IERC20(token1), router, amount1In);
    IRouter(router).addLiquidity(token0, token1, amount0In, amount1In, 0, 0, msg.sender, deadline);

    // Return remainder
    _returnRemainder([token0, token1, swap0.path[0]]);
  }

  function sellLiquidity(
    uint256 amount,
    address router,
    Swap memory swap0,
    Swap memory swap1,
    IPair from,
    uint256 deadline
  ) external payable {
    require(
      info.getBool(keccak256(abi.encodePacked("DFH:Contract:LPTokensManager:allowedRouter:", router))),
      "LPTokensManager::sellLiquidity: invalid router address"
    );
    require(
      swap0.path[swap0.path.length - 1] == swap1.path[swap1.path.length - 1],
      "LPTokensManager::sellLiqudity: end token not equals"
    );

    _payCommission();

    // Get tokens in
    address token0 = from.token0();
    require(swap0.path[0] == token0, "LPTokensManager::sellLiqudity: invalid token0");
    address token1 = from.token1();
    require(swap1.path[0] == token1, "LPTokensManager::sellLiqudity: invalid token1");

    // Remove liquidity
    IERC20(from).safeTransferFrom(msg.sender, address(this), amount);
    _approve(IERC20(from), router, amount);
    IRouter(router).removeLiquidity(token0, token1, amount, 0, 0, address(this), deadline);

    // Swap tokens
    uint256 amount0In = IERC20(token0).balanceOf(address(this));
    _approve(IERC20(token0), router, amount0In);
    _swap(router, amount0In, swap0.outMin, swap0.path, deadline);
    uint256 amount1In = IERC20(token1).balanceOf(address(this));
    _approve(IERC20(token1), router, amount1In);
    _swap(router, amount1In, swap1.outMin, swap1.path, deadline);

    _returnRemainder([token0, token1, swap0.path[swap0.path.length - 1]]);
  }
}
