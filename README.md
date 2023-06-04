# defihelper-protocol-upgradable

```
npx hardhat deploy --network avalanche --tags Lite --deploy ./deploy/upgrade/011_StoreV3
npx hardhat deploy --network main --tags Lite --deploy ./deploy/upgrade/011_StoreV3
npx hardhat deploy --network optimistic --tags Lite --deploy ./deploy/upgrade/011_StoreV3
npx hardhat deploy --network bsc --tags Lite --deploy ./deploy/upgrade/011_StoreV3
npx hardhat deploy --network polygon --tags Lite --deploy ./deploy/upgrade/011_StoreV3
npx hardhat deploy --network moonriver --tags Lite --deploy ./deploy/upgrade/011_StoreV3
npx hardhat deploy --network arbitrum --tags Lite --deploy ./deploy/upgrade/011_StoreV3


npx hardhat etherscan-verify --network avalanche --contract StoreUpgradable
npx hardhat etherscan-verify --network main --contract StoreUpgradable
npx hardhat etherscan-verify --network optimistic --contract StoreUpgradable
npx hardhat etherscan-verify --network bsc --contract StoreUpgradable
npx hardhat etherscan-verify --network polygon --contract StoreUpgradable
npx hardhat etherscan-verify --network moonriver --contract StoreUpgradable
npx hardhat etherscan-verify --network arbitrum --contract StoreUpgradable

npm run export-deploy -- --network avalanche
npm run export-deploy -- --network main
npm run export-deploy -- --network optimistic
npm run export-deploy -- --network bsc
npm run export-deploy -- --network polygon
npm run export-deploy -- --network moonriver

npm run export-abi -- --network  avalanche
npm run export-abi -- --network  main
npm run export-abi -- --network  optimistic
npm run export-abi -- --network  bsc
npm run export-abi -- --network  polygon
npm run export-abi -- --network  moonriver
```
