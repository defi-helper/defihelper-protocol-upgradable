const path = require("path");
const fs = require("fs");
const glob = require("tiny-glob");
const BN = require("bignumber.js");
const { TASK_COMPILE } = require("hardhat/builtin-tasks/task-names");
const { types } = require("hardhat/config");

class DeployerError extends Error {}

class Info {
  /**
   * @param {string} content
   */
  constructor(content = "") {
    this.content = content;
  }

  /**
   * @param {string} str
   *
   * @returns {Info}
   */
  m(str) {
    return new Info(`${this.content}${str}`);
  }

  /**
   * @param {string} str
   *
   * @returns {Info}
   */
  nl(str = "") {
    return new Info(`${this.content}\n`).m(str);
  }

  /**
   * @returns {string}
   */
  toString() {
    return this.content;
  }
}

/**
 * @typedef {{[library: string]: string}} Libraries
 * 
 * @typedef {{
 *   implementation: string;
 *   proxyAdmin: string;
 * }} UpgradableInfo
 * 
 * @typedef {{
 *   name: string;
 *   address: string;
 *   contractName: string;
 *   args: any[];
 *   libraries: Libraries;
 *   abi: import('ethers').ContractInterface
 *   transactionHash: string;
 *   blockNumber: number;
 *   upgradable: UpgradableInfo | undefined;
 * }} DeployedArtifact
 */
class DeploymentArtifacts {
  /**
   * @param {string} dir
   */
  constructor(dir) {
    this.dir = dir;
  }

  /**
   *
   * @param {string} contractName
   *
   * @returns {string}
   */
  path(contractName) {
    return path.resolve(this.dir, `./${contractName}.json`);
  }

  /**
   *
   * @param {string} contractName
   *
   * @returns {Promise<boolean>}
   */
  isDeployed(contractName) {
    return fs.promises
      .access(this.path(contractName), fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
  }

  /**
   *
   * @param {string} contractName
   *
   * @returns {Promise<DeployedArtifact>}
   */
  readDeploy(contractName) {
    return fs.promises
      .readFile(this.path(contractName))
      .then(JSON.parse)
      .catch((e) => {
        if (e.code === "ENOENT") {
          throw new DeployerError(
            `Deployed artifact for contract "${contractName}" not found on path "${artifactPath}"`
          );
        }
        throw e;
      });
  }

  /**
   * @param {{
   *   name: string;
   *   args: any[];
   *   libraries: Libraries;
   *   upgradable: UpgradableInfo | undefined;
   * }} deployed
   * @param {{
   *   artifact: import("hardhat/types").Artifact;
   *   receipt: import('ethers').ContractReceipt
   * }} result
   *
   * @returns {Promise<void>}
   */
  saveDeploy({ name, args, libraries, upgradable }, { artifact, receipt }) {
    return fs.promises.writeFile(
      this.path(name),
      JSON.stringify(
        {
          name,
          address: receipt.contractAddress,
          contractName: artifact.contractName,
          sourceName: artifact.sourceName,
          args,
          libraries,
          abi: artifact.abi,
          blockNumber: receipt.blockNumber,
          transactionHash: receipt.transactionHash,
          upgradable,
        },
        null,
        2
      ),
      { flag: "w" }
    );
  }
}

/**
 * @typedef {{
 *   name?: string;
 *   args?: any[];
 *   libraries?: Libraries;
 * }} DeployOptions
 */
class Deployer {
  /**
   * @param {import('hardhat')} hre
   * @param {DeploymentArtifacts} artifacts
   * @param {{[name: string]: import('@nomiclabs/hardhat-ethers/signers').SignerWithAddress}} namedAccounts
   */
  constructor(hre, artifacts, namedAccounts) {
    this.hre = hre;
    this.artifacts = artifacts;
    this.namedAccounts = namedAccounts;
  }

  /**
   * @param {string} name
   * @param {any[]} args
   * @param {string} path
   * @param {import('ethers').Contract} contract
   * @param {import('ethers').Transaction} transaction
   */
  deployInfo(
    name,
    args,
    path,
    { address },
    { hash, gasPrice, gasLimit, from }
  ) {
    console.info(
      new Info()
        .nl(`===== ${name}(${args.join(", ")}) =====`)
        .nl(` > Contract: ${path}`)
        .nl(` > Tx hash: ${hash}`)
        .nl(
          ` > Gas price: ${new BN(gasPrice.toString())
            .div("1e9")
            .toString(10)} Gwei`
        )
        .nl(` > Gas limit: ${gasLimit.toString()}`)
        .nl(` > Deployer: ${from}`)
        .nl(` > To: ${address}`)
        .toString()
    );
  }

  /**
   *
   * @param {string} contractName
   * @param {import('ethers').providers.Provider | import('ethers').Signer | undefined} signerOrProvider
   *
   * @returns {Promise<import('ethers').Contract>}
   */
  async getContract(contractName, signerOrProvider = undefined) {
    const { address, abi } = await this.artifacts.readDeploy(contractName);
    return new this.hre.ethers.Contract(
      address,
      abi,
      signerOrProvider ?? this.hre.ethers.getDefaultProvider()
    );
  }

  /**
   * @param {string} path
   * @param {DeployOptions | undefined} options
   *
   * @returns {Promise<void>}
   */
  async deploy(path, options = {}) {
    const { name, args, libraries } = {
      name: path,
      args: [],
      libraries: {},
      ...options,
    };

    const isAlreadyDeployed = await this.artifacts.isDeployed(name);
    if (isAlreadyDeployed) {
      return console.info(
        new Info().nl(`===== ${name} =====`).nl(`Already deployed`).toString()
      );
    }

    const artifact = await this.hre.artifacts.readArtifact(path);
    const factory = await this.hre.ethers.getContractFactoryFromArtifact(
      artifact,
      { libraries }
    );
    const contract = await factory.deploy(...args);
    const tx = contract.deployTransaction;
    this.deployInfo(name, args, path, contract, tx);
    const receipt = await tx.wait();
    console.info(
      new Info(` > Block number: ${receipt.blockNumber}`)
        .nl(
          ` > Gas used: ${new BN(receipt.gasUsed.toString())
            .multipliedBy(tx.gasPrice.toString())
            .div("1e18")
            .toString(10)} Eth`
        )
        .nl(`===== Deployed =====`)
        .toString()
    );

    return this.artifacts.saveDeploy(
      { name, args, libraries },
      { artifact, receipt }
    );
  }

  /**
   * @param {string} path
   * @param {DeployOptions & { initializer?: string } | undefined} options
   *
   * @returns {Promise<void>}
   */
  async deployProxy(path, options = {}) {
    const { name, args, libraries, initializer } = {
      name: path,
      args: [],
      libraries: {},
      initializer: "initialize",
      ...options,
    };

    const artifact = await this.hre.artifacts.readArtifact(path);
    const factory = await this.hre.ethers.getContractFactoryFromArtifact(
      artifact,
      { libraries }
    );
    const contract = await this.hre.upgrades.deployProxy(factory, args, {
      initializer,
    });
    const tx = contract.deployTransaction;
    this.deployInfo(name, args, path, contract, tx);
    const receipt = await tx.wait();
    const [proxyAdminAddress, implAddress] = await Promise.all([
      this.hre.upgrades.erc1967.getAdminAddress(contract.address),
      this.hre.upgrades.erc1967.getImplementationAddress(contract.address),
    ]);
    console.info(
      new Info(` > Block number: ${receipt.blockNumber}`)
        .nl(
          ` > Gas used: ${new BN(receipt.gasUsed.toString())
            .multipliedBy(tx.gasPrice.toString())
            .div("1e18")
            .toString(10)} Eth`
        )
        .nl(` > Implementation: ${implAddress}`)
        .nl(` > Proxy admin: ${proxyAdminAddress}`)
        .nl(`===== Deployed =====`)
        .toString()
    );

    return this.artifacts.saveDeploy(
      {
        name,
        args,
        libraries,
        upgradable: {
          implementation: implAddress,
          proxyAdmin: proxyAdminAddress,
        },
      },
      { artifact, receipt }
    );
  }

  /**
   * @param {string} proxyName,
   * @param {string} implementation
   * @param {{
   *   initializer?: string
   *   args?: any[];
   *   libraries?: Libraries;
   * } | undefined} options
   *
   * @returns {Promise<void>}
   */
  async upgradeProxy(proxyName, implementation, options = {}) {
    const { args, libraries, initializer } = {
      args: [],
      libraries: {},
      initializer: false,
      ...options,
    };

    const proxy = await this.artifacts.readDeploy(proxyName);
    const artifact = await this.hre.artifacts.readArtifact(implementation);
    const factory = await this.hre.ethers.getContractFactoryFromArtifact(
      artifact,
      { libraries }
    );
    const contract = await this.hre.upgrades.upgradeProxy(proxy.address, factory, {
      call: initializer !== false ? { fn: initializer, args } : undefined,
    });
    const tx = contract.deployTransaction;
    console.info(
      new Info()
        .nl(`===== ${proxyName} -> ${implementation} =====`)
        .nl(` > Proxy: ${proxy.address}`)
        .nl(` > Tx hash: ${tx.hash}`)
        .nl(
          ` > Gas price: ${new BN(tx.gasPrice.toString())
            .div("1e9")
            .toString(10)} Gwei`
        )
        .nl(` > Gas limit: ${tx.gasLimit.toString()}`)
        .nl(` > Deployer: ${tx.from}`)
        .toString()
    );
    const receipt = await tx.wait();
    const [proxyAdminAddress, implAddress] = await Promise.all([
      this.hre.upgrades.erc1967.getAdminAddress(contract.address),
      this.hre.upgrades.erc1967.getImplementationAddress(contract.address),
    ]);
    console.info(
      new Info(` > Block number: ${receipt.blockNumber}`)
        .nl(
          ` > Gas used: ${new BN(receipt.gasUsed.toString())
            .multipliedBy(tx.gasPrice.toString())
            .div("1e18")
            .toString(10)} Eth`
        )
        .nl(` > Implementation: ${implAddress}`)
        .nl(` > Proxy admin: ${proxyAdminAddress}`)
        .nl(`===== Upgraded =====`)
        .toString()
    );

    return fs.promises.writeFile(
      path.resolve(this.artifacts.dir, `./${proxyName}.json`),
      JSON.stringify(
        {
          name: proxy.name,
          address: proxy.address,
          contractName: artifact.contractName,
          sourceName: artifact.sourceName,
          args: proxy.args,
          libraries: proxy.libraries,
          abi: artifact.abi,
          transactionHash: receipt.transactionHash,
          blockNumber: proxy.blockNumber,
          upgradable: {
            implementation: implAddress,
            proxyAdmin: proxyAdminAddress,
          },
        },
        null,
        2
      ),
      { flag: "w" }
    );
  }

  /**
   *
   * @param {string} contractName
   * @param {string} method
   * @param {any[]} args
   * @param {{
   *   from: string;
   * }} options
   *
   * @returns {Promise<void>}
   */
  async execute(contractName, method, args, options = {}) {
    const { from } = {
      from: await this.hre.ethers.getSigners().then(([{ address }]) => address),
      ...options,
    };

    const contract = await this.getContract(
      contractName,
      await this.hre.ethers.getSigner(from)
    );
    if (typeof contract[method] !== "function") {
      throw new DeployerError(
        `Method "${method}" not found on contract "${contractName}"`
      );
    }

    const tx = await contract[method](...args).catch((e) => e);
    if (tx instanceof Error) {
      console.info(
        new Info()
          .nl(`===== ${contractName}.${method}(${args.join(", ")}) =====`)
          .nl(` > Contract: ${contract.address}`)
          .nl(` > From: ${from}`)
          .nl(
            ` > Reason: ${
              typeof tx.reason === "string" ? tx.reason : tx.message
            }`
          )
          .nl(`===== Error =====`)
          .toString()
      );
      return;
    }
    console.info(
      new Info()
        .nl(`===== ${contractName}.${method}(${args.join(", ")}) =====`)
        .nl(` > Contract: ${contract.address}`)
        .nl(` > Tx hash: ${tx.hash}`)
        .nl(
          ` > Gas price: ${new BN(tx.gasPrice.toString())
            .div("1e9")
            .toString(10)} Gwei`
        )
        .nl(` > Gas limit: ${tx.gasLimit.toString()}`)
        .nl(` > From: ${tx.from}`)
        .toString()
    );
    const receipt = await tx.wait();
    console.info(
      new Info(` > Block number: ${receipt.blockNumber}`)
        .nl(
          ` > Gas used: ${new BN(receipt.gasUsed.toString())
            .multipliedBy(tx.gasPrice.toString())
            .div("1e18")
            .toString(10)} Eth`
        )
        .nl(`===== Completed =====`)
        .toString()
    );
  }
}

/**
 * @param {(deployer: Deployer) => any} fn
 * @returns {(deployer: Deployer) => any}
 */
function migration(fn) {
  return (deployer) => fn(deployer);
}

task("deploy", "Deploy contracts")
  .addOptionalParam("deploy", "Path to the scripts deployment directory", "")
  .addOptionalParam(
    "artifact",
    "Path to the artifacts deployment directory",
    ""
  )
  .addOptionalParam("tags", "Target tags (comma separated)", "")
  .addOptionalParam(
    "compile",
    "Is compile sources before run",
    true,
    types.boolean
  )
  .setAction(async (options, hre) => {
    if (options.compile) await run(TASK_COMPILE);

    const tags = options.tags !== "" ? options.tags.split(",") : [];
    const deployDir =
      options.deploy !== "" ? options.deploy : hre.config.paths.deploy;
    const artifactDir =
      options.artifact !== "" ? options.artifact : hre.config.paths.deployments;
    const signers = await hre.ethers.getSigners();
    const namedAccounts = Object.entries(hre.config.namedAccounts).reduce(
      (result, [name, config]) => {
        const accountIndex = config[hre.network.name]
          ? config[hre.network.name]
          : config[""] ?? 0;
        return { ...result, [name]: signers[accountIndex] };
      },
      {}
    );
    const deploymentsDir = path.resolve(artifactDir, hre.network.name);
    await fs.promises.mkdir(deploymentsDir, { recursive: true });
    await fs.promises.writeFile(
      path.resolve(deploymentsDir, "./.chainId"),
      String(hre.network.config.chainId),
      { flag: "w" }
    );

    const scriptsPath = await glob(path.resolve(deployDir, "**/*.js"), {
      absolute: true,
    });
    const scripts = scriptsPath
      .map((scriptPath) => require(scriptPath))
      .filter((script) => {
        if (typeof script !== "function") {
          return false;
        }
        if (tags.length > 0) {
          if (!Array.isArray(script.tags)) {
            return false;
          }
          if (script.tags.filter((tag) => tags.includes(tag)).length == 0) {
            return false;
          }
        }

        return true;
      });
    if (scripts.length === 0) {
      throw new DeployerError(
        `Deploy scripts by path "${deployDir}"${
          tags.length > 0 ? ` with tags "${tags.join(", ")}" ` : " "
        }not found`
      );
    }
    const deployer = new Deployer(
      hre,
      new DeploymentArtifacts(deploymentsDir),
      namedAccounts
    );
    await scripts.reduce(
      async (prev, script) => prev.then(() => script(deployer)),
      Promise.resolve(null)
    );
  });

task("etherscan-verify", "Verify all deployed contract on etherscan")
  .addParam("contract", "Target contract")
  .addOptionalParam(
    "artifact",
    "Path to the artifacts deployment directory",
    ""
  )
  .setAction(async (options, hre) => {
    const artifactDir =
      options.artifact !== "" ? options.artifact : hre.config.paths.deployments;

    const deploymentsDir = path.resolve(artifactDir, hre.network.name);
    const {
      name,
      address,
      args,
      libraries,
      contractName,
      sourceName,
      upgradable,
    } = await fs.promises
      .readFile(path.resolve(deploymentsDir, `./${options.contract}.json`))
      .then((v) => JSON.parse(v));
    console.info(new Info().nl(`===== ${name} =====`).toString());

    if (upgradable !== undefined) {
      return hre.run("verify", {
        address,
      });
    }

    return hre
      .run("verify:verify", {
        address,
        contract: `${sourceName}:${contractName}`,
        constructorArguments: args,
        libraries,
      })
      .catch((e) => {
        if (e.message.includes("Reason: Already Verified")) {
          return console.info(
            `${contractName}: Contract source code already verified`
          );
        }
        if (
          e.message.includes(
            `The address provided as argument contains a contract, but its bytecode doesn't match the contract`
          ) ||
          e.message.includes("Contract source code already verified")
        ) {
          return console.info(`${name}: ${e.message}`);
        }
        console.log(e.message);
        throw e;
      });
  });

task("export-deployed", "Export info of deployed contract")
  .addParam("file", "Output file")
  .addOptionalParam("fields", "Export fields", "*")
  .addOptionalParam(
    "artifact",
    "Path to the artifacts deployment directory",
    ""
  )
  .setAction(async (options, hre) => {
    const artifactDir =
      options.artifact !== "" ? options.artifact : hre.config.paths.deployments;

    const deploymentsDir = path.resolve(artifactDir, hre.network.name);
    const fields = options.fields.split(",");

    await fs.promises.mkdir(path.dirname(options.file), { recursive: true });
    const currentExport = await fs.promises
      .readFile(options.file)
      .then((v) => JSON.parse(v))
      .catch(() => ({}));
    const deployments = await glob(path.resolve(deploymentsDir, "./*.json"), {
      absolute: true,
    }).catch((e) => {
      throw new DeployerError(
        `Deploy directory "${deploymentsDir}" not found (maybe --network options not set?)`
      );
    });
    const networkExport = await deployments.reduce(
      async (prev, deployArtifactPath) => {
        const result = await prev;
        const deployment = await fs.promises
          .readFile(deployArtifactPath)
          .then((v) => JSON.parse(v));
        return {
          ...result,
          [deployment.name]: fields.includes("*")
            ? deployment
            : fields.reduce(
                (result, field) => ({ ...result, [field]: deployment[field] }),
                {}
              ),
        };
      },
      Promise.resolve(currentExport[hre.network.config.chainId] ?? {})
    );
    await fs.promises.writeFile(
      options.file,
      JSON.stringify(
        {
          ...currentExport,
          [hre.network.config.chainId]: networkExport,
        },
        null,
        2
      ),
      { flag: "w" }
    );
  });

task("export-abi", "Export ABI of deployed contract")
  .addParam("dir", "Output directory")
  .setAction(async (options, hre) => {
    await fs.promises.mkdir(options.dir, { recursive: true });
    const artifactsDir = path.resolve(
      hre.config.paths.artifacts,
      "./contracts"
    );
    const artifacts = await glob(path.resolve(artifactsDir, "./**/*.sol"), {
      absolute: true,
    }).catch((e) => {
      throw new DeployerError(
        `Artifacts directory "${artifactsDir}" not found`
      );
    });
    await artifacts.reduce(async (prev, artifactPath) => {
      await prev;
      const artifactName = path.parse(artifactPath).name;
      const artifact = await hre.artifacts.readArtifact(artifactName);
      return fs.promises.writeFile(
        path.resolve(options.dir, `./${artifactName}.json`),
        JSON.stringify(
          {
            abi: artifact.abi,
          },
          null,
          4
        ),
        { flag: "w" }
      );
    }, Promise.resolve(null));
  });

module.exports = {
  DeployerError,
  DeploymentArtifacts,
  Deployer,
  migration,
};
