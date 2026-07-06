// routes/goldPrice.js

const express = require('express');
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
    // Check if cache is still fresh (less than 1 hour old)
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
      timeout: 10000,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    // Parse the response - it comes as a string, so we need to parse it
    let rates = data;
    if (typeof data === 'string') {
      rates = JSON.parse(data);
    }

    // Format the response
    const prices = {
      '24K': {
        gram: Math.round(parseFloat(rates.gram_in_php) * 100) / 100,
        ounce: Math.round(parseFloat(rates.ounce_in_php) * 100) / 100,
      },
      '22K': {
        gram: Math.round(parseFloat(rates.gram_in_php) * 0.916 * 100) / 100,
        ounce: Math.round(parseFloat(rates.ounce_in_php) * 0.916 * 100) / 100,
      },
      '18K': {
        gram: Math.round(parseFloat(rates.gram_in_php) * 0.750 * 100) / 100,
        ounce: Math.round(parseFloat(rates.ounce_in_php) * 0.750 * 100) / 100,
      },
      updated_at: new Date().toISOString(),
      source: 'GoldPricez API',
    };

    // Cache the prices
    cachedPrices = prices;
    cacheTime = Date.now();

    console.log('✅ Prices fetched successfully:', prices);
    res.json(prices);

  } catch (error) {
    console.error('❌ Error fetching gold prices:', error);
    
    // Return cached prices if available (fallback)
    if (cachedPrices) {
      console.log('⚠️ API failed, returning cached prices');
      return res.json(cachedPrices);
    }

    // If no cache, return error
    res.status(500).json({
      error: 'Failed to fetch gold prices',
      message: error.message,
      fallback: {
        '24K': { gram: 8238.76 },
        '22K': { gram: 7550.45 },
        '18K': { gram: 6180.57 },
      },
    });
  }
});

module.exports = router;
