// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../IRouter.sol";

contract RouterMock is IRouter {
  address public lpToken;

  mapping(address => uint256) public prices;

  constructor(address _lpToken) {
    lpToken = _lpToken;
  }

  function setPrice(address token, uint256 price) external {
    prices[token] = price;
  }

  function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256
  ) public override returns (uint256[] memory amounts) {
    IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
    uint256 price = prices[path[path.length - 1]];
    IERC20(path[path.length - 1]).transfer(to, price != 0 ? price * amountIn : amountOutMin);

    return amounts;
  }

  function swapExactTokensForTokensSupportingFeeOnTransferTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external override {
    swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline);
  }

  function addLiquidity(
    address tokenA,
    address tokenB,
    uint256 amountADesired,
    uint256 amountBDesired,
    uint256,
    uint256,
    address to,
    uint256
  )
    external
    override
    returns (
      uint256 amountA,
      uint256 amountB,
      uint256 liquidity
    )
  {
    amountA = amountADesired;
    IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
    amountB = amountBDesired;
    IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);
    liquidity = 10e18;
    IERC20(lpToken).transfer(to, liquidity);
  }

  function removeLiquidity(
    address tokenA,
    address tokenB,
    uint256 liquidity,
    uint256,
    uint256,
    address to,
    uint256
  ) external override returns (uint256 amountA, uint256 amountB) {
    IERC20(lpToken).transferFrom(msg.sender, address(this), liquidity);
    amountA = liquidity / 2;
    IERC20(tokenA).transfer(to, amountA);
    amountB = liquidity - amountA;
    IERC20(tokenB).transfer(to, amountB);
  }

  function getAmountsOut(uint256 amountIn, address[] memory path)
    external
    view
    override
    returns (uint256[] memory amounts)
  {
    amounts = new uint256[](path.length);
    for (uint256 i = 0; i < path.length; i++) {
      amounts[i] = i == path.length - 1 ? amountIn * prices[path[path.length - 1]] : amountIn;
    }
  }
}
