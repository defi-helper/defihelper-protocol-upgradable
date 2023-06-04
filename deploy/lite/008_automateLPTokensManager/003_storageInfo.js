const { migration } = require('../../../scripts/deploy');
const { network } = require('hardhat');
const { utils } = require('ethers');

const wrappers = {
  1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  5: '0x7b109d1E02a56b7FcE042ffb609ac4AC1de07310',
  10: '0x4200000000000000000000000000000000000006',
  56: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  137: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  1285: '0x98878B06940aE243284CA214f92Bb71a2b032B8A',
  42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  43114: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
};

module.exports = migration(async () => {
  console.info(
    `Storage.setAddress("${utils.keccak256(utils.toUtf8Bytes('NativeWrapper:Contract'))}", ${wrappers[network.config.chainId]})`,
  );
});

module.exports.tags = ['DFH', 'Lite', 'Protocol', 'NonUpgradable'];
