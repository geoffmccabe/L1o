import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [prices, setPrices] = useState({ l1Usd: null, l1Krw: null, avaxUsd: null, avaxKrw: null, ethUsd: null, ethKrw: null });
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    async function fetchPrices() {
      try {
        const response = await axios.get('/api/update-token-prices');
        const ethResponse = await axios.get('/api/scrape-pyth');
        setPrices({
          l1Usd: response.data.l1PriceUsd,
          l1Krw: response.data.l1PriceKrw,
          avaxUsd: response.data.avaxPriceUsd,
          avaxKrw: response.data.avaxPriceKrw,
          ethUsd: ethResponse.data.priceUsd,
          ethKrw: ethResponse.data.priceKrw
        });
      } catch (error) {
        console.error(error);
      }
    }
    fetchPrices();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>L1o Oracle Demo</h1>
      <div>
        <label>Currency: </label>
        <select onChange={(e) => setCurrency(e.target.value)} value={currency}>
          <option value="USD">USD</option>
          <option value="KRW">KRW</option>
        </select>
      </div>
      <p>L1 Coin: {currency === 'USD' ? prices.l1Usd ? `$${prices.l1Usd}` : 'Loading...' : prices.l1Krw ? `${prices.l1Krw} KRW` : 'Loading...'}</p>
      <p>WAVAX: {currency === 'USD' ? prices.avaxUsd ? `$${prices.avaxUsd}` : 'Loading...' : prices.avaxKrw ? `${prices.avaxKrw} KRW` : 'Loading...'}</p>
      <p>ETH: {currency === 'USD' ? prices.ethUsd ? `$${prices.ethUsd}` : 'Loading...' : prices.ethKrw ? `${prices.ethKrw} KRW` : 'Loading...'}</p>
    </div>
  );
}
