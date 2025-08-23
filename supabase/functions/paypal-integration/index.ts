import { Hono } from 'npm:hono@3.12.11';
import { cors } from 'npm:hono/cors';

// --- Environment Variables ---
const PAYPAL_BASE_URL = Deno.env.get('PAYPAL_BASE_URL') || 'https://api-m.sandbox.paypal.com';
const CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
const CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// --- Helper: Get PayPal Access Token ---
async function getPayPalAccessToken() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`PayPal auth failed: ${error}`);
  }

  const data = await res.json();
  return data.access_token;
}

// --- Helper: Create Subscription in Supabase ---
async function createSubscription(paymentData: any, planId: string, userId: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase credentials not configured, skipping subscription creation');
    return null;
  }

  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const paymentInfo = paymentData.purchase_units[0].payments.captures[0];
    const amount = parseFloat(paymentInfo.amount.value);
    
    // Calculate end date based on plan
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    if (planId === 'premium-monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planId === 'premium-yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const { data, error } = await supabase.from('premium_subscriptions').insert({
      user_id: userId,
      plan_id: planId,
      plan_name: planId === 'premium-monthly' ? 'Premium Monthly' : 
                 planId === 'premium-yearly' ? 'Premium Yearly' : 'Premium Plan',
      amount: Math.round(amount * 100),
      currency: paymentInfo.amount.currency_code,
      payment_method: 'paypal',
      payment_provider: 'paypal',
      payment_id: paymentInfo.id,
      status: 'active',
      is_active: true,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    });

    if (error) {
      console.error('Supabase subscription creation error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to create subscription:', error);
    return null;
  }
}

// --- Initialize Hono App ---
const app = new Hono();
app.use('*', cors({
  origin: ['http://localhost:5000', 'https://*.replit.app', 'https://*.replit.dev'],
  credentials: true,
}));

// --- Health Check ---
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    paypal_configured: !!(CLIENT_ID && CLIENT_SECRET),
    supabase_configured: !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  });
});

// --- Main PayPal Handler (Unified Endpoint) ---
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { action } = body;

    if (action === 'create') {
      // CREATE ORDER
      const { amount, currency = 'USD', description } = body;
      
      if (!amount || amount <= 0) {
        return c.json({ error: 'Invalid amount' }, 400);
      }

      const accessToken = await getPayPalAccessToken();

      const orderPayload = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: Number(amount).toFixed(2)
          },
          description: description || 'HubX Premium Subscription'
        }],
        application_context: {
          return_url: `${c.req.header('origin') || 'http://localhost:5000'}/premium?success=true`,
          cancel_url: `${c.req.header('origin') || 'http://localhost:5000'}/premium?cancelled=true`,
          brand_name: 'HubX',
          locale: 'en-US',
          landing_page: 'BILLING'
        }
      };

      const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': crypto.randomUUID()
        },
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('PayPal order creation failed:', error);
        return c.json({ error: 'Failed to create PayPal order' }, 500);
      }

      const orderData = await response.json();
      return c.json({ 
        id: orderData.id, 
        status: orderData.status,
        links: orderData.links 
      });

    } else if (action === 'capture') {
      // CAPTURE ORDER
      const { orderId, planId, userId } = body;
      
      if (!orderId) {
        return c.json({ error: 'Order ID is required' }, 400);
      }

      const accessToken = await getPayPalAccessToken();

      const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': crypto.randomUUID()
        }
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('PayPal capture failed:', error);
        return c.json({ error: 'Failed to capture PayPal payment' }, 500);
      }

      const captureData = await response.json();

      // Create subscription if payment was successful
      if (captureData.status === 'COMPLETED' && planId && userId) {
        const subscription = await createSubscription(captureData, planId, userId);
        console.log('Subscription created:', subscription);
      }

      return c.json({
        id: captureData.id,
        status: captureData.status,
        payer: captureData.payer,
        amount: captureData.purchase_units[0].amount,
        subscription_created: !!(planId && userId)
      });

    } else {
      return c.json({ error: 'Invalid action. Use "create" or "capture"' }, 400);
    }

  } catch (error: any) {
    console.error('PayPal function error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error.message 
    }, 500);
  }
});

// --- Legacy Routes (for backward compatibility) ---
app.post('/create-order', async (c) => {
  const { amount, currency = 'USD' } = await c.req.json();
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: currency, value: Number(amount).toFixed(2) } }]
    })
  });

  const orderData = await response.json();
  return c.json({ id: orderData.id, status: orderData.status });
});

app.post('/capture-order/:orderID', async (c) => {
  const orderID = c.req.param('orderID');
  const accessToken = await getPayPalAccessToken();

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
});

// --- Refund Route ---
app.post('/refund', async (c) => {
  try {
    const { captureID, amount, reason = 'Customer request' } = await c.req.json();
    
    if (!captureID) {
      return c.json({ error: 'Capture ID is required' }, 400);
    }

    const accessToken = await getPayPalAccessToken();

    const refundPayload: any = {
      note_to_payer: reason
    };

    if (amount) {
      refundPayload.amount = {
        value: Number(amount).toFixed(2),
        currency_code: 'USD'
      };
    }

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/payments/captures/${captureID}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': crypto.randomUUID()
      },
      body: JSON.stringify(refundPayload)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('PayPal refund failed:', error);
      return c.json({ error: 'Failed to process refund' }, 500);
    }

    const refundData = await response.json();
    return c.json({ 
      id: refundData.id, 
      status: refundData.status,
      amount: refundData.amount
    });

  } catch (error: any) {
    console.error('Refund error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// --- Serve the Function ---
Deno.serve(app.fetch);
