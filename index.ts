import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS
app.use(cors());
app.use(express.json());

// ✅ GOLD PRICE ENDPOINT
app.get('/api/gold-prices', async (req, res) => {
  try {
    const API_KEY = process.env.GOLDPRICEZ_API_KEY;
    const API_URL = 'https://goldpricez.com/api/rates/currency/php/measure/all';
    
    const response = await fetch(API_URL, {
      headers: { 'X-API-KEY': API_KEY }
    });
    
    const data = await response.json();
    const gram_php = parseFloat(data.gram_in_php);
    
    res.json({
      '24K': { gram: Math.round(gram_php * 100) / 100 },
      '22K': { gram: Math.round(gram_php * 0.916 * 100) / 100 },
      '18K': { gram: Math.round(gram_php * 0.75 * 100) / 100 },
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const SUPABASE_URL = 'https://jorjpcdhxhwfnfnrilzf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SmU9_prO2J3v7gqbbsNlxA_7iodBDiZ';
const PAYMONGO_SECRET_KEY = 'sk_live_WUR3aQzPPwh7j2417xWXTJYv';

app.post('/api/create-qrph', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ error: 'Amount required' });
    const authHeader = 'Basic ' + Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64');
    const response = await fetch('https://api.paymongo.com/v1/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amount,
            currency: 'PHP',
            type: 'QRph',
            redirect: { success: 'https://bulawanph.com/payment-success.html', failed: 'https://bulawanph.com/payment.html' }
          }
        }
      })
    });
    const data = await response.json();
    if (data.data?.attributes?.source_url) {
      return res.json({ success: true, qrUrl: data.data.attributes.source_url, sourceId: data.data.id });
    }
    res.status(400).json({ success: false, error: data.errors?.[0]?.detail || 'Error' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/signup', async (req, res) => {
  const { email, password, full_name } = req.body;
  try {
    const response = await fetch(SUPABASE_URL + '/rest/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password: btoa(password), full_name, premium: false })
    });
    const data = await response.json();
    res.json(response.ok ? { success: true } : { success: false, error: data.message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/signin', async (req, res) => {
  const { email, password } = req.body;
  try {
    const response = await fetch(SUPABASE_URL + '/rest/v1/users?email=eq.' + encodeURIComponent(email), {
      headers: { 'apikey': SUPABASE_ANON_KEY }
    });
    const users = await response.json();
    if (!users[0]) return res.status(401).json({ error: 'User not found' });
    const user = users[0];
    if (user.password !== btoa(password)) return res.status(401).json({ error: 'Invalid password' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/update-premium', async (req, res) => {
  const { user_id } = req.body;
  try {
    const response = await fetch(SUPABASE_URL + '/rest/v1/users?id=eq.' + user_id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ premium: true })
    });
    const data = await response.json();
    res.json({ success: true, user: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`✅ Server on ${PORT}`));
