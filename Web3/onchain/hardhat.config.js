require("@nomicfoundation/hardhat-toolbox")
require("@nomicfoundation/hardhat-verify")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

//https://github.com/fullstack-development/blockchain-wiki-en/tree/main/protocols/onchain-id

/*const privateKey = vars.get("PRIVATE_KEY");
if (!privateKey) console.warn("⚠️  WARNING: PRIVATE_KEY environment variable not found.");*/

// yarn add -D @nomicfoundation/hardhat-chai-matchers @nomicfoundation/hardhat-ethers @nomicfoundation/hardhat-ignition @nomicfoundation/hardhat-ignition-ethers @nomicfoundation/hardhat-network-helpers @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-verify @nomiclabs/hardhat-ethers @openzeppelin/contracts @typechain/ethers-v6 @typechain/hardhat babel-eslint chai dotenv ethers hardhat hardhat-contract-sizer hardhat-deploy hardhat-gas-reporter prettier prettier-plugin-solidity solhint solidity-coverage typechain


const PRIVATE_KEY_DEPLOYER = process.env.PRIVATE_KEY_DEPLOYER || ""
const PRIVATE_KEY_INVESTOR = process.env.PRIVATE_KEY_INVESTOR || ""
const PRIVATE_KEY_ENTITY = process.env.PRIVATE_KEY_ENTITY || ""



/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
        },
        localhost: {
            chainId: 31337,
        },
        avalanche: {
            url: process.env.AVALANCHE_MAINNET_RPC || "https://rpc.ankr.com/avax",
            chainId: 43114,
            accounts: [PRIVATE_KEY_DEPLOYER, PRIVATE_KEY_INVESTOR, PRIVATE_KEY_ENTITY],
            saveDeployments: true,
            blockConfirmations: 2,
        },
        fuji: {
            url: process.env.AVALANCHE_FUJI_RPC || "https://rpc.ankr.com/avax_fuji",
            chainId: 43113,
            accounts: [PRIVATE_KEY_DEPLOYER, PRIVATE_KEY_INVESTOR, PRIVATE_KEY_ENTITY],
            saveDeployments: true,
            blockConfirmations: 2,
        },
        
    },
    etherscan: {
        // Migración a Etherscan API V2: una sola API key para múltiples cadenas
        // https://docs.etherscan.io/v2-migration
        apiKey: {
            avalancheFujiTestnet: process.env.ETHERSCAN_API_KEY || "",
        },
        // Usamos el endpoint unificado V2 para todas las redes soportadas
        customChains: [
             {
              network: "avalancheFujiTestnet",
              chainId: 43113,
              urls: {
                apiURL: "https://api-testnet.snowtrace.io/api",
                browserURL: "https://testnet.snowtrace.io"
              }
            },
        ],
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
        investor:{
            default: 1,
            1: 1,
        },
        entity:{
            default: 2,
            1: 2,
        }
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS || false,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    },
    solidity: {
        compilers: [
            {
                version: "0.8.24",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 50,
                    },
                },
            },
            {
                version: "0.8.0",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 50,
                    },
                },
            },
        ],
    },
    mocha: {
        timeout: 200000, // 200 seconds max for running tests
    },
    /*
    contractSizer: {
        runOnCompile: false,
        only: ["contractName"],

    },*/
}
