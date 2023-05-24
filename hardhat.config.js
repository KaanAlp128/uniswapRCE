require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.7.6",
        settings: { optimizer: { enabled: true, runs: 100 } },
      },
      {
        version: "0.8.0",
        settings: { optimizer: { enabled: true, runs: 100 } },
      },
      {
        version: "0.5.0",
        settings: { optimizer: { enabled: true, runs: 100 } },
      },
    ],
  },
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
    },
  },

};
