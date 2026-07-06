import express from 'express';

const router = express.Router();

const API_KEY = process.env.GOLDPRICEZ_API_KEY;
const API_URL = 'https://goldpricez.com/api/rates/currency/php/measure/all';
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

let cachedPrices = null;
let cacheTime = 0;

/**
 * GET /api/gold-prices
 * Returns current gold prices in PHP
 */
router.get('/', async (req, res) => {
  try {
    // Set CORS headers for this endpoint
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-KEY');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    // Check if cache is still fresh
    if (cachedPrices && Date.now() - cacheTime < CACHE_DURATION) {
      console.log('✅ Returning cached prices');
      return res.json(cachedPrices);
    }

    console.log('🔄 Fetching fresh prices from GoldPricez API...');

    // Make the API request
    const response = await fetch(API_URL, {
      headers: {
        'X-API-KEY': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    // Calculate prices for different karats
    const gram_php = parseFloat(data.gram_in_php);
    
    const prices = {
      '24K': {
        gram: Math.round(gram_php * 100) / 100,
        ounce: Math.round(parseFloat(data.ounce_in_php) * 100) / 100,
      },
      '22K': {
        gram: Math.round(gram_php * 0.916 * 100) / 100,
        ounce: Math.round(parseFloat(data.ounce_in_php) * 0.916 * 100) / 100,
      },
      '18K': {
        gram: Math.round(gram_php * 0.75 * 100) / 100,
        ounce: Math.round(parseFloat(data.ounce_in_php) * 0.75 * 100) / 100,
      },
      updated_at: new Date().toISOString(),
      source: 'GoldPricez API',
    };

    // Cache the prices
    cachedPrices = prices;
    cacheTime = Date.now();

    console.log('✅ Prices fetched:', prices);
    return res.json(prices);

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Return cached prices if available
    if (cachedPrices) {
      console.log('⚠️ Using cached prices');
      return res.json(cachedPrices);
    }

    // Fallback prices
    return res.status(500).json({
      error: 'Failed to fetch prices',
      message: error.message,
      fallback: {
        '24K': { gram: 8238.76 },
        '22K': { gram: 7550.45 },
        '18K': { gram: 6180.57 },
      },
    });
  }
});

export default router;
