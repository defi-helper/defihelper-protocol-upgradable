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
      forking: {
        url: process.env.GOERLI_NODE
      }
    },
    main: {
      url: process.env.ETH_MAIN_NODE || 'http://127.0.0.1:8545',
      chainId: 1,
      gasPrice: 12_000_000_000,
      blockGasLimit: 6_000_000,
      accounts: accounts(
        'ETH_MAIN_DEPLOYER',
        'ETH_MAIN_INSPECTOR',
        'ETH_MAIN_CONSUMER1',
        'ETH_MAIN_CONSUMER2',
        'ETH_MAIN_CONSUMER3',
      ),
    },
    goerli: {
      url: process.env.GOERLI_NODE || 'http://127.0.0.1:8545',
      chainId: 5,
      gasPrice: 15_000_000_000,
      blockGasLimit: 6_000_000,
      accounts: accounts(
          'GOERLI_DEPLOYER',
          'GOERLI_INSPECTOR',
          'GOERLI_CONSUMER1',
          'GOERLI_CONSUMER2',
          'GOERLI_CONSUMER3',
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
      gasPrice: 28_000_000_000,
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
      gasPrice: 50_000_000_000,
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
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
