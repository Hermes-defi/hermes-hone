require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");

require('dotenv').config({ path: '.env' });
module.exports = {
  solidity: "0.8.4",
  networks: {
    hardhat: {
      blockGasLimit: 12_450_000,
      hardfork: "london"
    },
    localhost: {
      url: 'http://localhost:8545',
    },
    one: {
      url: 'https://rpc.hermesdefi.io',
      accounts: [`${process.env.PRIVATE_KEY}`]
    },
  },
};
