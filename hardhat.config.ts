import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();
const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY");
const OPTIMISM_SCAN_API_KEY = vars.get("OPTIMISM_SCAN_API_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`],
      chainId: 11155111,
    },
    "OP Sepolia": {
      url: `https://opt-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`],
      chainId: 11155420,
    },
    "OP Mainnet": {
      url: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      // specify private key in command when deploying to mainnet
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
      chainId: 10,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
      "OP Mainnet": OPTIMISM_SCAN_API_KEY,
    },
    customChains: [
      {
        network: "OP Sepolia",
        chainId: 11155420,
        urls: {
          apiURL: `https://api-sepolia-optimistic.etherscan.io/api/`,
          browserURL: "https://sepolia-optimism.etherscan.io/",
        },
      },
      {
        network: "OP Mainnet",
        chainId: 10,
        urls: {
          apiURL: `https://api-optimistic.etherscan.io/api/`,
          browserURL: "https://optimistic.etherscan.io/",
        },
      },
    ],
  },
};

export default config;
