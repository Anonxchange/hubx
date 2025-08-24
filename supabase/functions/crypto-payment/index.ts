import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  price_amount: number;
  price_currency: string;
  pay_currency?: string;
  order_id?: string;
  order_description?: string;
  success_url?: string;
  cancel_url?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const nowPaymentsApiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
    const nowPaymentsApiUrl = Deno.env.get('NOWPAYMENTS_API_URL');

    console.log('Environment check:', {
      hasApiKey: !!nowPaymentsApiKey,
      apiUrl: nowPaymentsApiUrl,
      keyLength: nowPaymentsApiKey ? nowPaymentsApiKey.length : 0
    });

    if (!nowPaymentsApiKey || !nowPaymentsApiUrl) {
      throw new Error('NowPayments API credentials not configured');
    }

    console.log('Processing crypto payment request...');

    if (req.method === 'POST') {
      const paymentData: PaymentRequest = await req.json();
      
      console.log('Payment data received:', {
        amount: paymentData.price_amount,
        currency: paymentData.price_currency,
        pay_currency: paymentData.pay_currency
      });

      // Create payment with NowPayments
      console.log('Making payment request to:', `${nowPaymentsApiUrl}/v1/payment`);
      const response = await fetch(`${nowPaymentsApiUrl}/v1/payment`, {
        method: 'POST',
        headers: {
          'x-api-key': nowPaymentsApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_amount: paymentData.price_amount,
          price_currency: paymentData.price_currency,
          pay_currency: paymentData.pay_currency || 'btc',
          order_id: paymentData.order_id || `order_${Date.now()}`,
          order_description: paymentData.order_description || 'Crypto Payment',
          ipn_callback_url: `${req.headers.get("origin")}/api/payment-callback`,
        }),
      });

      console.log('Payment response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('NowPayments API error:', errorData);
        throw new Error(`Payment creation failed: ${response.status} ${errorData}`);
      }

      const paymentResult = await response.json();
      console.log('Payment created successfully:', paymentResult.payment_id);

      return new Response(JSON.stringify({
        success: true,
        payment: paymentResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET request - fetch available currencies
    if (req.method === 'GET') {
      console.log('Fetching available currencies...');
      console.log('Making request to:', `${nowPaymentsApiUrl}/v1/currencies`);
      
      const response = await fetch(`${nowPaymentsApiUrl}/v1/currencies`, {
        method: 'GET',
        headers: {
          'x-api-key': nowPaymentsApiKey,
        },
      });

      console.log('Currencies response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch currencies: ${response.status}`);
      }

      const currencies = await response.json();
      console.log('Available currencies fetched successfully');

      return new Response(JSON.stringify({
        success: true,
        currencies: currencies.currencies || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in crypto-payment function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});