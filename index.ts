import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// QRPH Payment Creation
app.post('/api/create-qrph', async (req, res) => {
  const { amount, email, name } = req.body;
  const PAYMONGO_SECRET = process.env.PAYMONGO_SECRET_KEY;
  
  try {
    const response = await fetch('https://api.paymongo.com/v1/sources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(PAYMONGO_SECRET + ':').toString('base64')
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: Math.round(amount * 100),
            currency: 'PHP',
            type: 'qrph',
            redirect: {
              success: 'https://bulawanph.com/payment-success.html',
              failed: 'https://bulawanph.com/payment.html'
            }
          }
        }
      })
    });

    const data = await response.json();
    res.json({ success: true, qrUrl: data.data.attributes.source_url, sourceId: data.data.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SIGN UP
app.post('/api/signup', async (req, res) => {
  const { email, password, full_name } = req.body;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  
  try {
    const response = await fetch(SUPABASE_URL + '/rest/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY
      },
      body: JSON.stringify({
        email: email,
        password: btoa(password),
        full_name: full_name,
        premium: false
      })
    });

    const data = await response.json();
    if (response.ok) {
      res.json({ success: true, message: 'Account created' });
    } else {
      res.status(400).json({ success: false, error: data.message || 'Sign up failed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// SIGN IN
app.post('/api/signin', async (req, res) => {
  const { email, password } = req.body;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  
  try {
    const response = await fetch(
      SUPABASE_URL + '/rest/v1/users?email=eq.' + encodeURIComponent(email),
      {
        headers: { 'apikey': SUPABASE_KEY }
      }
    );

    const users = await response.json();
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    
    const user = users[0];
    if (user.password !== btoa(password)) {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        premium: user.premium
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE PREMIUM
app.post('/api/update-premium', async (req, res) => {
  const { user_id } = req.body;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  
  try {
    const response = await fetch(
      SUPABASE_URL + '/rest/v1/users?id=eq.' + user_id,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY
        },
        body: JSON.stringify({
          premium: true
        })
      }
    );

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

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
