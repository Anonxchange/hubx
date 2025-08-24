import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const nowPaymentsApiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
const nowPaymentsApiUrl = Deno.env.get('NOWPAYMENTS_API_URL');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { action, ...data } = await req.json();
  console.log(`NOWPayments API action: ${action}`, data);

  try {
    switch (action) {
      case 'getAvailableCurrencies':
        return await getAvailableCurrencies();
        
      case 'createPayment':
        return await createPayment(data);
        
      case 'getPaymentStatus':
        return await getPaymentStatus(data.paymentId);
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }
  } catch (error) {
    console.error('Error in crypto-payment function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function getAvailableCurrencies() {
  console.log('Fetching available currencies from NOWPayments');
  
  const response = await fetch(`${nowPaymentsApiUrl}/currencies`, {
    method: 'GET',
    headers: {
      'x-api-key': nowPaymentsApiKey!,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  console.log('Available currencies response:', data);

  // Filter to show popular crypto currencies
  const popularCryptos = ['btc', 'eth', 'usdt', 'usdc', 'bnb', 'ada', 'dot', 'ltc', 'xrp'];
  const filteredCurrencies = data.currencies?.filter((currency: string) => 
    popularCryptos.includes(currency.toLowerCase())
  ) || [];

  return new Response(
    JSON.stringify({ 
      currencies: filteredCurrencies,
      success: true 
    }), 
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function createPayment(paymentData: any) {
  console.log('Creating payment with NOWPayments:', paymentData);
  
  const { amount, currency, payoutCurrency = 'usd', description = 'Crypto Payment' } = paymentData;

  const paymentRequest: any = {
    price_amount: parseFloat(amount),
    price_currency: payoutCurrency,
    pay_currency: currency.toLowerCase(),
    order_id: `order_${Date.now()}`,
    order_description: description,
    success_url: `${paymentData.returnUrl}?status=success`,
    cancel_url: `${paymentData.returnUrl}?status=cancelled`,
  };

  // Only include ipn_callback_url if we have a valid webhook URL
  // For now, we'll omit it since we don't have a webhook endpoint set up
  
  console.log('Payment request payload:', paymentRequest);

  const response = await fetch(`${nowPaymentsApiUrl}/payment`, {
    method: 'POST',
    headers: {
      'x-api-key': nowPaymentsApiKey!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentRequest),
  });

  const data = await response.json();
  console.log('Create payment response:', data);

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create payment');
  }

  return new Response(
    JSON.stringify({ 
      payment: data,
      success: true 
    }), 
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function getPaymentStatus(paymentId: string) {
  console.log('Getting payment status for:', paymentId);
  
  const response = await fetch(`${nowPaymentsApiUrl}/payment/${paymentId}`, {
    method: 'GET',
    headers: {
      'x-api-key': nowPaymentsApiKey!,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  console.log('Payment status response:', data);

  return new Response(
    JSON.stringify({ 
      payment: data,
      success: true 
    }), 
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
