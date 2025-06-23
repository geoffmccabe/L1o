require('@nomiclabs/hardhat-ethers');
require('dotenv').config();

module.exports = {
  solidity: '0.8.0',
  networks: {
    lamina1Testnet: {
      url: process.env.LAMINA1_RPC || 'https://subnets.avax.network/lamina1tes/testnet/rpc',
      accounts: process.env.L1T_PRIVATE_KEY ? [process.env.L1T_PRIVATE_KEY] : [],
      chainId: 764984
    }
  }
};
