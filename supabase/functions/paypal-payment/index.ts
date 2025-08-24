import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayPalAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayPalOrder {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
  let baseUrl = Deno.env.get('PAYPAL_BASE_URL') || 'https://api-m.sandbox.paypal.com';
  
  // Remove trailing slash to prevent double slash issues
  baseUrl = baseUrl.replace(/\/$/, '');

  console.log('PayPal Config:', {
    clientId: clientId ? `${clientId.substring(0, 10)}...` : 'missing',
    clientSecret: clientSecret ? 'present' : 'missing',
    baseUrl
  });

  if (!clientId || !clientSecret) {
    throw new Error('Missing PayPal credentials: PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required');
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const authUrl = `${baseUrl}/v1/oauth2/token`;
  
  console.log('Attempting PayPal authentication to:', authUrl);

  try {
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0',
      },
      body: 'grant_type=client_credentials',
    });

    console.log('PayPal auth response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('PayPal auth error response:', errorText);
      
      if (response.status === 401) {
        throw new Error('PayPal authentication failed: Invalid client credentials. Please verify your PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
      }
      
      if (response.status === 403) {
        throw new Error('PayPal authentication failed: Access forbidden. Please check if your PayPal app has the correct permissions and your credentials are for the right environment (sandbox vs production).');
      }
      
      throw new Error(`PayPal authentication failed: ${response.status} - ${errorText}`);
    }

    const data: PayPalAccessTokenResponse = await response.json();
    console.log('PayPal authentication successful');
    return data.access_token;
  } catch (error) {
    console.error('PayPal authentication error:', error);
    throw error;
  }
}

async function createPayPalOrder(amount: string, currency: string = 'USD'): Promise<PayPalOrder> {
  const accessToken = await getPayPalAccessToken();
  let baseUrl = Deno.env.get('PAYPAL_BASE_URL') || 'https://api-m.sandbox.paypal.com';
  baseUrl = baseUrl.replace(/\/$/, '');

  const orderData = {
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: currency,
        value: amount,
      },
    }],
  };

  console.log('Creating PayPal order with data:', JSON.stringify(orderData, null, 2));

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Supabase-Edge-Function/1.0',
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('PayPal order creation error:', errorText);
    throw new Error(`PayPal order creation failed: ${response.status} - ${errorText}`);
  }

  const order = await response.json();
  console.log('PayPal order created successfully:', order.id);
  return order;
}

async function capturePayPalOrder(orderId: string): Promise<any> {
  const accessToken = await getPayPalAccessToken();
  let baseUrl = Deno.env.get('PAYPAL_BASE_URL') || 'https://api-m.sandbox.paypal.com';
  baseUrl = baseUrl.replace(/\/$/, '');

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Supabase-Edge-Function/1.0',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('PayPal capture error:', errorText);
    throw new Error(`PayPal capture failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('PayPal order captured successfully:', result.id);
  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'create';

    console.log(`PayPal function called with action: ${action}`);

    if (action === 'create') {
      const { amount, currency } = await req.json();
      
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid amount provided' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`Creating PayPal order for ${amount} ${currency || 'USD'}`);
      const order = await createPayPalOrder(amount, currency);
      
      return new Response(
        JSON.stringify({ 
          orderId: order.id, 
          status: order.status,
          approvalUrl: order.links.find(link => link.rel === 'approve')?.href 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'capture') {
      const { orderId } = await req.json();
      
      if (!orderId) {
        return new Response(
          JSON.stringify({ error: 'Order ID is required for capture' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`Capturing PayPal order: ${orderId}`);
      const result = await capturePayPalOrder(orderId);
      
      return new Response(
        JSON.stringify({ 
          orderId: result.id,
          status: result.status,
          captureResult: result 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "create" or "capture"' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('PayPal function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString(),
        troubleshooting: {
          credentials: 'Verify PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are correct',
          environment: 'Ensure PAYPAL_BASE_URL matches your environment (sandbox vs production)',
          permissions: 'Check that your PayPal app has the necessary permissions'
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
