import { ethers } from 'ethers';
import axios from 'axios';

const heliusApiKey = process.env.HELIUS_API_KEY;
const lamina1Rpc = process.env.LAMINA1_RPC;
const oracleAddress = process.env.ORACLE_ADDRESS;
const privateKey = process.env.L1T_PRIVATE_KEY;
const ethAddress = process.env.ETH_ADDRESS || '0x0000000000000000000000000000000000000000';

const provider = new ethers.providers.JsonRpcProvider(lamina1Rpc);
const wallet = new ethers.Wallet(privateKey, provider);
const oracleAbi = ['function updateTokenPrice(address token, uint256 priceUsd, uint256 priceKrw) external'];
const oracleContract = new ethers.Contract(oracleAddress, oracleAbi, wallet);

export default async function handler(req, res) {
  try {
    // Scrape Pyth ETH/USD
    const pythResponse = await axios.post(`https://devnet.helius-rpc.com/?api-key=${heliusApiKey}`, {
      jsonrpc: '2.0',
      id: 1,
      method: 'getAccountInfo',
      params: ['H6ARHf6YXhGYeQfUzQNGk6rDNQKbc5DLfDuULpL6am', { encoding: 'jsonParsed' }],
    });

    if (pythResponse.status !== 200) {
      throw new Error(`Pyth API failed: ${pythResponse.statusText}`);
    }

    const pythData = pythResponse.data.result.value.data.parsed;
    const priceUsd = pythData.price;
    const publishTime = pythData.publish_time;
    const currentTime = Math.floor(Date.now() / 1000);

    let finalPriceUsd, finalPriceKrw;

    if (currentTime - publishTime <= 60) {
      // Use fresh Pyth data
      finalPriceUsd = Math.round(priceUsd * 1e18); // 18 decimals
      const gobanqResponse = await axios.get('https://www.gobanq.com/p/prices.json');
      if (gobanqResponse.status !== 200) {
        throw new Error(`GoBanq API failed: ${gobanqResponse.statusText}`);
      }
      const krwRate = gobanqResponse.data.fiat.KRW;
      finalPriceKrw = Math.round(finalPriceUsd * krwRate / 1e18); // 18 decimals
    } else {
      // Fallback to GoBanq
      const gobanqResponse = await axios.get('https://www.gobanq.com/p/prices.json');
      if (gobanqResponse.status !== 200) {
        throw new Error(`GoBanq API failed: ${gobanqResponse.statusText}`);
      }
      finalPriceUsd = Math.round(gobanqResponse.data.prices.ETH * 1e18); // 18 decimals
      finalPriceKrw = Math.round(finalPriceUsd * gobanqResponse.data.fiat.KRW / 1e18);
    }

    // Update Lamina1oracle.sol
    const tx = await oracleContract.updateTokenPrice(ethAddress, finalPriceUsd, finalPriceKrw);
    await tx.wait();

    res.status(200).json({ priceUsd: finalPriceUsd / 1e18, priceKrw: finalPriceKrw });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
