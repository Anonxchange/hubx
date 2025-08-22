import { Hono } from 'npm:hono@3.12.11';
import { cors } from 'npm:hono/cors';

// PayPal OAuth & API Base URL (use sandbox for testing)
const PAYPAL_BASE_URL = Deno.env.get('PAYPAL_BASE_URL') || 'https://api-m.sandbox.paypal.com';
const CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID')!;
const CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET')!;

// Utility function to get access token
async function getPayPalAccessToken() {
  const auth = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error('Failed to obtain PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

const app = new Hono();

// Enable CORS for all routes
app.use('*', cors());

// Generate PayPal order
app.post('/paypal-integration/create-order', async (c) => {
  try {
    const accessToken = await getPayPalAccessToken();
    const { amount, currency = 'USD' } = await c.req.json();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount.toString()
          }
        }]
      })
    });

    const orderData = await response.json();
    return c.json({
      id: orderData.id,
      status: orderData.status
    });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Capture PayPal order
app.post('/paypal-integration/capture-order/:orderID', async (c) => {
  try {
    const accessToken = await getPayPalAccessToken();
    const orderID = c.req.param('orderID');

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const captureData = await response.json();
    return c.json({
      id: captureData.id,
      status: captureData.status,
      payer: captureData.payer,
      amount: captureData.purchase_units[0].amount
    });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Refund a transaction
app.post('/paypal-integration/refund', async (c) => {
  try {
    const accessToken = await getPayPalAccessToken();
    const { captureID, amount } = await c.req.json();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/payments/captures/${captureID}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        amount: {
          value: amount.toString(),
          currency_code: 'USD'
        }
      })
    });

    const refundData = await response.json();
    return c.json({
      id: refundData.id,
      status: refundData.status
    });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Health check endpoint
app.get('/paypal-integration/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

Deno.serve(app.fetch);