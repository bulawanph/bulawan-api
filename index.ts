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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amount,
            currency: 'PHP',
            type: 'QRph',
            redirect: {
              success: 'https://bulawanph.com/payment-success.html',
              failed: 'https://bulawanph.com/payment.html'
            }
          }
        }
      })
    });

    const data = await response.json();
    
    if (data.data?.attributes?.source_url) {
      return res.json({ 
        success: true, 
        qrUrl: data.data.attributes.source_url, 
        sourceId: data.data.id 
      });
    }
    
    if (data.errors) {
      return res.status(400).json({ 
        success: false, 
        error: data.errors[0]?.detail || 'PayMongo error' 
      });
    }
    
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid PayMongo response',
      details: data 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SIGNUP
app.post('/api/signup', async (req, res) => {
  const { email, password, full_name } = req.body;
  
  try {
    const response = await fetch(SUPABASE_URL + '/rest/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, password: btoa(password), full_name, premium: false })
    });
    const data = await response.json();
    if (response.ok) {
      res.json({ success: true, message: 'Account created' });
    } else {
      res.status(400).json({ success: false, error: data.message || 'Failed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// SIGNIN
app.post('/api/signin', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const response = await fetch(SUPABASE_URL + '/rest/v1/users?email=eq.' + encodeURIComponent(email), {
      headers: { 'apikey': SUPABASE_ANON_KEY }
    });
    const users = await response.json();
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    const user = users[0];
    if (user.password !== btoa(password)) {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }
    res.json({ success: true, user: { id: user.id, email: user.email, full_name: user.full_name, premium: user.premium } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE PREMIUM
app.post('/api/update-premium', async (req, res) => {
  const { user_id } = req.body;
  
  try {
    const response = await fetch(SUPABASE_URL + '/rest/v1/users?id=eq.' + user_id, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ premium: true })
    });
    const data = await response.json();
    if (response.ok) {
      res.json({ success: true, user: data[0] });
    } else {
      res.status(400).json({ success: false, error: 'Update failed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ FIXED CORS MIDDLEWARE - Allow Cloudflare & all origins
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-KEY');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Max-Age', '3600');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.listen(PORT, () => console.log(`Server on ${PORT}`));
