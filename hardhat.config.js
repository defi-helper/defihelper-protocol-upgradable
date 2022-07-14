require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-etherscan');
require('@openzeppelin/hardhat-upgrades');
require('./scripts/deploy');
require('dotenv').config();
const path = require('path');

function accounts(...names) {
  return names.reduce((accounts, name) => (process.env[name] ? [...accounts, process.env[name]] : accounts), []);
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: '0.8.6',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    deploy: path.resolve(__dirname, './deploy'),
    deployments: path.resolve(__dirname, './deployments'),
  },
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0,
      blockGasLimit: 10000000,
    },
    main: {
      url: process.env.ETH_MAIN_NODE || 'http://127.0.0.1:8545',
      chainId: 1,
      gasPrice: 40_000_000_000,
      blockGasLimit: 6_000_000,
      accounts: accounts(
        'ETH_MAIN_DEPLOYER',
        'ETH_MAIN_INSPECTOR',
        'ETH_MAIN_CONSUMER1',
        'ETH_MAIN_CONSUMER2',
        'ETH_MAIN_CONSUMER3',
      ),
    },
    ropsten: {
      url: process.env.ROPSTEN_NODE || 'http://127.0.0.1:8545',
      chainId: 3,
      gasPrice: 10_000_000_000,
      blockGasLimit: 6_000_000,
      accounts: accounts('ROPSTEN_DEPLOYER', 'ROPSTEN_OTHER'),
    },
    rinkeby: {
      url: process.env.ETH_RINKEBY_NODE || 'http://127.0.0.1:8545',
      chainId: 4,
      gasPrice: 25_000_000_000,
      blockGasLimit: 6_000_000,
      accounts: accounts(
        'ETH_RINKEBY_DEPLOYER',
        'ETH_RINKEBY_INSPECTOR',
        'ETH_RINKEBY_CONSUMER1',
        'ETH_RINKEBY_CONSUMER2',
        'ETH_RINKEBY_CONSUMER3',
      ),
    },
    bsc: {
      url: process.env.BSC_NODE || 'http://127.0.0.1:8545',
      chainId: 56,
      gasPrice: 7_000_000_000,
      blockGasLimit: 6_000_000,
      accounts: accounts('BSC_DEPLOYER', 'BSC_INSPECTOR', 'BSC_CONSUMER1', 'BSC_CONSUMER2', 'BSC_CONSUMER3'),
    },
    bscTest: {
      url: process.env.BSC_TEST_NODE || 'http://127.0.0.1:8545',
      chainId: 97,
      gasPrice: 10_000_000_000,
      blockGasLimit: 6_000_000,
      accounts: accounts(
        'BSC_TEST_DEPLOYER',
        'BSC_TEST_INSPECTOR',
        'BSC_TEST_CONSUMER1',
        'BSC_TEST_CONSUMER2',
        'BSC_TEST_CONSUMER3',
      ),
    },
    avalanche: {
      url: process.env.AVALANCHE_NODE || 'http://127.0.0.1:8545',
      chainId: 43114,
      gasPrice: 25_000_000_000,
      blockGasLimit: 8_000_000,
      accounts: accounts(
        'AVALANCHE_DEPLOYER',
        'AVALANCHE_INSPECTOR',
        'AVALANCHE_CONSUMER1',
        'AVALANCHE_CONSUMER2',
        'AVALANCHE_CONSUMER3',
      ),
    },
    avalancheTest: {
      url: process.env.AVALANCHE_TEST_NODE || 'http://127.0.0.1:8545',
      chainId: 43113,
      gasPrice: 50_000_000_000,
      blockGasLimit: 8_000_000,
      accounts: accounts(
        'AVALANCHE_TEST_DEPLOYER',
        'AVALANCHE_TEST_INSPECTOR',
        'AVALANCHE_TEST_CONSUMER1',
        'AVALANCHE_TEST_CONSUMER2',
        'AVALANCHE_TEST_CONSUMER3',
      ),
    },
    polygon: {
      url: process.env.POLYGON_NODE || 'http://127.0.0.1:8545',
      chainId: 137,
      gasPrice: 30_000_000_000,
      blockGasLimit: 21_000_000,
      accounts: accounts(
        'POLYGON_DEPLOYER',
        'POLYGON_INSPECTOR',
        'POLYGON_CONSUMER1',
        'POLYGON_CONSUMER2',
        'POLYGON_CONSUMER3',
      ),
    },
    mumbai: {
      url: process.env.POLYGON_MUMBAI_NODE || 'http://127.0.0.1:8545',
      chainId: 80001,
      gasPrice: 30_000_000_000,
      blockGasLimit: 20_000_000,
      accounts: accounts(
        'POLYGON_MUMBAI_DEPLOYER',
        'POLYGON_MUMBAI_INSPECTOR',
        'POLYGON_MUMBAI_CONSUMER1',
        'POLYGON_MUMBAI_CONSUMER2',
        'POLYGON_MUMBAI_CONSUMER3',
      ),
    },
    moonriver: {
      url: process.env.MOONRIVER_NODE || 'http://127.0.0.1:8545',
      chainId: 1285,
      gasPrice: 1_000_000_000,
      blockGasLimit: 15_000_000,
      accounts: accounts(
        'MOONRIVER_DEPLOYER',
        'MOONRIVER_INSPECTOR',
        'MOONRIVER_CONSUMER1',
        'MOONRIVER_CONSUMER2',
        'MOONRIVER_CONSUMER3',
      ),
    },
    moonbaseAlpha: {
      url: process.env.MOONBASE_ALPHA_NODE || 'http://127.0.0.1:8545',
      chainId: 1287,
      gasPrice: 1_000_000_000,
      blockGasLimit: 15_000_000,
      accounts: accounts(
        'MOONBASE_ALPHA_DEPLOYER',
        'MOONBASE_ALPHA_INSPECTOR',
        'MOONBASE_ALPHA_CONSUMER1',
        'MOONBASE_ALPHA_CONSUMER2',
        'MOONBASE_ALPHA_CONSUMER3',
      ),
    },
    optimistic: {
      url: process.env.OPTIMISTIC_NODE || 'http://127.0.0.1:8545',
      chainId: 10,
      gasPrice: 1_000_000,
      blockGasLimit: 15_000_000,
      accounts: accounts(
        'OPTIMISTIC_DEPLOYER',
        'OPTIMISTIC_INSPECTOR',
        'OPTIMISTIC_CONSUMER1',
        'OPTIMISTIC_CONSUMER2',
        'OPTIMISTIC_CONSUMER3',
      ),
    },
  },
  namedAccounts: {
    deployer: {
      '': 0,
    },
    inspector: {
      '': 1,
    },
    consumer1: {
      '': 2,
    },
    consumer2: {
      '': 3,
    },
    consumer3: {
      '': 4,
    },
    priceFeed: {
      '': '0x0000000000000000000000000000000000000000',
      'main': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
      'ropsten': '0x64125B3eDF8C778c0814A6cd368a133764B1e156',
      'optimistic': '0x13e3Ee699D1909E989722E753853AE30b17e08c5',
      'bsc': '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE',
      'bscTest': '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526',
      'polygon': '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0',
      'moonriver': '0x3f8BFbDc1e79777511c00Ad8591cef888C2113C1',
      'avalancheTest': '0x5498BB86BC934c8D34FDA08E81D444153d0D06aD',
      'avalanche': '0x0A77230d17318075983913bC2145DB16C7366156',
      'avalancheTest': '0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada',
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
