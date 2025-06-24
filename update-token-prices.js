import { ethers } from 'ethers';
import axios from 'axios';

const lamina1Rpc = process.env.LAMINA1_RPC;
const oracleAddress = process.env.ORACLE_ADDRESS;
const privateKey = process.env.L1T_PRIVATE_KEY;
const l1Address = process.env.L1_ADDRESS || '0x0000000000000000000000000000000000000000';
const avaxAddress = process.env.WAVAX_ADDRESS || '0x0000000000000000000000000000000000000000';

const provider = new ethers.providers.JsonRpcProvider(lamina1Rpc);
const wallet = new ethers.Wallet(privateKey, provider);
const oracleAbi = ['function updateTokenPrice(address token, uint256 priceUsd, uint256 priceKrw) external'];
const oracleContract = new ethers.Contract(oracleAddress, oracleAbi, wallet);

export default async function handler(req, res) {
  try {
    // Fetch prices from GoBanq
    const response = await axios.get('https://www.gobanq.com/p/prices.json');
    if (response.status !== 200) {
      throw new Error(`GoBanq API failed: ${response.statusText}`);
    }
    const prices = response.data.prices;
    const krwRate = response.data.fiat.KRW;

    // Update L1 coin
    const l1PriceUsd = Math.round(prices.LAMINA1 * 1e18); // 18 decimals
    const l1PriceKrw = Math.round(l1PriceUsd * krwRate / 1e18);
    const l1Tx = await oracleContract.updateTokenPrice(l1Address, l1PriceUsd, l1PriceKrw);
    await l1Tx.wait();

    // Update WAVAX
    const avaxPriceUsd = Math.round(prices.AVAX * 1e18);
    const avaxPriceKrw = Math.round(avaxPriceUsd * krwRate / 1e18);
    const avaxTx = await oracleContract.updateTokenPrice(avaxAddress, avaxPriceUsd, avaxPriceKrw);
    await avaxTx.wait();

    res.status(200).json({ l1PriceUsd: l1PriceUsd / 1e18, l1PriceKrw, avaxPriceUsd: avaxPriceUsd / 1e18, avaxPriceKrw });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
