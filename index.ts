import express from 'express';
import cors from 'cors';
import goldPriceRouter from './routes/goldPrice.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Gold Price API Route
app.use('/api/gold-prices', goldPriceRouter);

// Env vars
const SUPABASE_URL = 'https://jorjpcdhxhwfnfnrilzf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SmU9_prO2J3v7gqbbsNlxA_7iodBDiZ';
const PAYMONGO_SECRET_KEY = 'sk_live_WUR3aQzPPwh7j2417xWXTJYv';

// QRPH - WITH CAPITAL LETTERS
app.post('/api/create-qrph', async (req, res) => {
  try {
    const { amount, email, name } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount required' });
    }

    const authHeader = 'Basic ' + Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64');

    const response = await fetch('https://api.paymongo.com/v1/sources', {
      method: 'POST',
