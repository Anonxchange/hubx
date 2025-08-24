import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  amount: number;
  currency: string;
  cryptocurrency?: string;
  orderId?: string;
}

interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  paymentUrl?: string;
  qrCode?: string;
  error?: string;
}

const NOWPAYMENTS_API_KEY = "D0NCM3M-7EAMCPG-NAG7YXW-FB5C87D";
const NOWPAYMENTS_PUBLIC_KEY = "0704a9d4-4954-49d0-8b15-258eddd70b68";
const NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1";

// Minimum amounts for different cryptocurrencies (in USD equivalent)
const MINIMUM_AMOUNTS: Record<string, number> = {
  'btc': 5.0,   // Bitcoin minimum $5
  'eth': 5.0,   // Ethereum minimum $5
  'usdt': 1.0,  // USDT minimum $1
  'usdc': 1.0,  // USDC minimum $1
  'bnb': 2.0,   // BNB minimum $2
  'ada': 2.0,   // ADA minimum $2
  'dot': 2.0,   // DOT minimum $2
  'ltc': 2.0,   // LTC minimum $2
};

const validateMinimumAmount = (amount: number, currency: string, cryptocurrency: string): string | null => {
  const minAmount = MINIMUM_AMOUNTS[cryptocurrency.toLowerCase()] || 5.0;
  
  // For simplicity, assuming 1:1 conversion for non-USD currencies
  // In production, you'd want to use real exchange rates
  let usdAmount = amount;
  
  if (usdAmount < minAmount) {
    return `Minimum amount for ${cryptocurrency.toUpperCase()} is $${minAmount} USD equivalent`;
  }
  
  return null;
};

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 Crypto payment function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const { amount, currency, cryptocurrency = 'btc', orderId }: PaymentRequest = await req.json();
      
      console.log('💰 Creating payment:', { amount, currency, cryptocurrency, orderId });

      // Validate minimum amount
      const minAmountError = validateMinimumAmount(amount, currency, cryptocurrency);
      if (minAmountError) {
        console.log('❌ Minimum amount validation failed:', minAmountError);
        
        const errorResponse: PaymentResponse = {
          success: false,
          error: minAmountError,
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // Check if the cryptocurrency is available
      console.log('🔍 Checking available currencies...');
      
      try {
        const currenciesResponse = await fetch(`${NOWPAYMENTS_API_URL}/currencies`, {
          headers: {
            'x-api-key': NOWPAYMENTS_API_KEY,
          },
        });

        if (currenciesResponse.ok) {
          const currencies = await currenciesResponse.json();
          if (!currencies.currencies?.includes(cryptocurrency.toLowerCase())) {
            throw new Error(`Cryptocurrency ${cryptocurrency.toUpperCase()} is not supported`);
          }
        }
      } catch (currencyError) {
        console.log('⚠️ Could not verify currency availability:', currencyError);
        // Continue anyway, let NOWPayments API handle it
      }

      // Create payment with NOWPayments API
      const paymentData = {
        price_amount: amount,
        price_currency: currency.toUpperCase(),
        pay_currency: cryptocurrency.toLowerCase(),
        order_id: orderId || `order_${Date.now()}`,
        order_description: `Crypto payment for ${amount} ${currency.toUpperCase()}`,
        ipn_callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/crypto-payment/webhook`,
        success_url: `${req.headers.get('origin')}/payment/success`,
        cancel_url: `${req.headers.get('origin')}/payment/cancel`,
      };

      console.log('📡 Sending request to NOWPayments API...');
      
      const response = await fetch(`${NOWPAYMENTS_API_URL}/payment`, {
        method: 'POST',
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const responseData = await response.json();
      console.log('📥 NOWPayments API response:', responseData);

      if (!response.ok) {
        let errorMessage = responseData.message || 'Unknown error occurred';
        
        // Handle specific error cases
        if (responseData.code === 'AMOUNT_MINIMAL_ERROR') {
          errorMessage = `The amount is too small for ${cryptocurrency.toUpperCase()}. Please increase the amount and try again.`;
        } else if (responseData.message?.includes('minimal')) {
          errorMessage = `Minimum payment amount not met for ${cryptocurrency.toUpperCase()}. Please increase the amount.`;
        }
        
        throw new Error(errorMessage);
      }

      // Store payment in database
      const { error: dbError } = await supabase
        .from('crypto_payments')
        .insert([
          {
            payment_id: responseData.payment_id,
            order_id: paymentData.order_id,
            amount: amount,
            currency: currency.toUpperCase(),
            cryptocurrency: cryptocurrency.toLowerCase(),
            status: 'pending',
            payment_url: responseData.invoice_url,
            created_at: new Date().toISOString(),
          }
        ]);

      if (dbError) {
        console.error('❌ Database error:', dbError);
      }

      const result: PaymentResponse = {
        success: true,
        paymentId: responseData.payment_id,
        paymentUrl: responseData.invoice_url,
        qrCode: responseData.qr_code,
      };

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const paymentId = url.searchParams.get('paymentId');
      
      if (!paymentId) {
        throw new Error('Payment ID is required');
      }

      console.log('🔍 Checking payment status:', paymentId);

      // Check payment status with NOWPayments API
      const response = await fetch(`${NOWPAYMENTS_API_URL}/payment/${paymentId}`, {
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY,
        },
      });

      const paymentData = await response.json();
      console.log('📊 Payment status:', paymentData);

      // Update database with current status
      const { error: dbError } = await supabase
        .from('crypto_payments')
        .update({ 
          status: paymentData.payment_status,
          updated_at: new Date().toISOString(),
        })
        .eq('payment_id', paymentId);

      if (dbError) {
        console.error('❌ Database update error:', dbError);
      }

      return new Response(JSON.stringify(paymentData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Webhook endpoint for NOWPayments IPN
    if (req.url.includes('/webhook')) {
      console.log('🔔 Webhook received');
      const webhookData = await req.json();
      
      // Update payment status in database
      const { error: dbError } = await supabase
        .from('crypto_payments')
        .update({ 
          status: webhookData.payment_status,
          updated_at: new Date().toISOString(),
        })
        .eq('payment_id', webhookData.payment_id);

      if (dbError) {
        console.error('❌ Webhook database error:', dbError);
      }

      return new Response('OK', {
        status: 200,
        headers: corsHeaders,
      });
    }

    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });

  } catch (error: any) {
    console.error('❌ Error in crypto payment function:', error);
    
    const errorResponse: PaymentResponse = {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};

serve(handler);
