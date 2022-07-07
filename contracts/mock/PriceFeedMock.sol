// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.6;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PriceFeedMock is AggregatorV3Interface, Ownable {
  uint8 public override decimals;

  string public override description;

  uint256 public override version;

  struct Round {
    uint80 roundId;
    int256 answer;
    uint256 startedAt;
    uint256 updatedAt;
    uint80 answeredInRound;
  }

  mapping(uint80 => Round) internal _rounds;

  uint80 public latestRound;

  constructor(
    uint8 _decimals,
    string memory _description,
    uint256 _version
  ) {
    decimals = _decimals;
    description = _description;
    version = _version;
  }

  function addRoundData(int256 answer) external onlyOwner {
    latestRound++;
    // solhint-disable-next-line not-rely-on-time
    _rounds[latestRound] = Round(latestRound, answer, block.timestamp, block.timestamp, latestRound);
  }

  function getRoundData(uint80 _roundId)
    public
    view
    override
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    Round storage round = _rounds[_roundId];

    return (round.roundId, round.answer, round.startedAt, round.updatedAt, round.answeredInRound);
  }

  function latestRoundData()
    external
    view
    override
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    return getRoundData(latestRound);
  }
}
