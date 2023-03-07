const hardhat = require('hardhat');
const BN = require('bignumber.js');
const { ethers } = hardhat;

class TokenAmount {
  constructor(decimals, amount) {
    this.decimals = decimals;
    this.amount = amount;

    this.fromFloat = (amount) => {
      amount = typeof amount === 'object' ? amount.toString() : amount;
      return new TokenAmount(decimals, new BN(`${amount}e${decimals}`).toFixed(0));
    };

    this.fromInt = (amount) => {
      amount = typeof amount === 'object' ? amount.toString() : amount;
      return new TokenAmount(decimals, amount);
    };
  }

  toString() {
    return new BN(this.amount).div(`1e${this.decimals}`).toString(10);
  }

  toFixed() {
    return this.amount;
  }
}

async function tokenDeploy({ name, symbol, totalSupply } = {}) {
  const decimals = 18;
  const Token = await ethers.getContractFactory('ERC20Mock');
  const contract = await Token.deploy(name ?? '', symbol ?? '', totalSupply ?? new BN(`100e${decimals}`).toFixed(0));
  await contract.deployed();

  return { decimals, contract, amount: new TokenAmount(decimals, 0) };
}

async function token({ address, signer }) {
  signer = signer ?? (await ethers.getSigner());
  const IERC20 = await hardhat.artifacts.readArtifact('contracts/mock/ERC20Mock.sol:ERC20Mock');
  return new ethers.Contract(address, IERC20.abi, signer);
}

async function priceFeedDeploy({ price }) {
  const decimals = 8;
  const PriceFeed = await ethers.getContractFactory('PriceFeedMock');
  const contract = await PriceFeed.deploy(decimals, '', 1);
  await contract.deployed();
  await contract.addRoundData(new BN(`${price}e${decimals}`).toFixed(0));

  return {
    contract,
    decimals,
  };
}

async function storageDeploy({ data }) {
  const Storage = await ethers.getContractFactory('Storage');
  const contract = await Storage.deploy();
  await contract.deployed();

  await data.reduce(async (prev, { method, key, value }) => {
    await prev;

    return contract[method](ethers.utils.keccak256(ethers.utils.toUtf8Bytes(key)), value);
  }, Promise.resolve(null));

  return {
    contract,
  };
}

const feeAmount = {
  LOWEST: 100,
  LOW: 500,
  MEDIUM: 3000,
  HIGH: 10000,
};

const tickSpacings = {
  [100]: 1,
  [500]: 10,
  [3000]: 60,
  [10000]: 200,
};

const MIN_TICK = -887272;
const MAX_TICK = -MIN_TICK;

function nearestUsableTick(tick, tickSpacing) {
  const rounded = Math.round(tick / tickSpacing) * tickSpacing;
  if (rounded < MIN_TICK) return rounded + tickSpacing;
  else if (rounded > MAX_TICK) return rounded - tickSpacing;
  else return rounded;
}

async function uni3({ signer } = {}) {
  signer = signer ?? (await ethers.getSigner());

  const IERC20 = await hardhat.artifacts.readArtifact('contracts/mock/ERC20Mock.sol:ERC20Mock');
  const token0 = new ethers.Contract('0x57f6d7137B4b535971cC832dE0FDDfE535A4DB22', IERC20.abi, signer);
  const token1 = new ethers.Contract('0xafd2Dfb918777d9bCC29E315C4Df4551208DBE82', IERC20.abi, signer);

  const IPositionManagerArtifact = await hardhat.artifacts.readArtifact(
    'contracts/automate/Uni3/interfaces/INonfungiblePositionManager.sol:INonfungiblePositionManager',
  );
  const positionManager = new ethers.Contract(
    '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    IPositionManagerArtifact.abi,
    signer,
  );

  const IFactory = await hardhat.artifacts.readArtifact('contracts/automate/Uni3/interfaces/IFactory.sol:IFactory');
  const factory = new ethers.Contract('0x1F98431c8aD98523631AE4a59f267346ea31F984', IFactory.abi, signer);

  const IPool = await hardhat.artifacts.readArtifact('contracts/automate/Uni3/interfaces/IPool.sol:IPool');
  const pool = new ethers.Contract(
    await factory.getPool(token0.address, token1.address, feeAmount.MEDIUM),
    IPool.abi,
    signer,
  );

  const IRouter = await hardhat.artifacts.readArtifact(
    'contracts/automate/Uni3/interfaces/ISwapRouter.sol:ISwapRouter',
  );
  const router = new ethers.Contract('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', IRouter.abi, signer);

  return {
    token0,
    token1,
    positionManager,
    factory,
    pool,
    router,
  };
}

module.exports = {
  tokenDeploy,
  token,
  priceFeedDeploy,
  storageDeploy,
  uni3,
  feeAmount,
  tickSpacings,
  nearestUsableTick,
};
