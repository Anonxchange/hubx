import React, { useState, useEffect, useRef } from 'react';
import { X, Crown, Check } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from 'react-router-dom';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Interface for crypto payment details
interface CryptoPaymentDetails {
  pay_amount: string;
  pay_currency: string;
  pay_address: string;
  price_amount: string;
  expiration_estimate_date: string;
  payment_id: string;
  payment_status: string;
}

declare global {
  interface Window {
    paypal: any;
  }
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState('12months');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'creditcard' | 'paypal' | 'crypto'>('creditcard');
  const [selectedCrypto, setSelectedCrypto] = useState('btc');
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isSignIn, setIsSignIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // State for the crypto payment modal
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [cryptoPaymentDetails, setCryptoPaymentDetails] = useState<CryptoPaymentDetails | null>(null);


  // Assuming subscriptionPlans is fetched elsewhere or defined here
  const subscriptionPlans = [
    { id: '2day', title: '2-day trial', subtitle: 'Limited access', price: '$0.99', amount: 0.99, period: '/2 days', badge: 'TRY IT', badgeColor: 'bg-red-500', recommended: false },
    { id: '12months', title: '12 months', subtitle: '', price: '$2.99', amount: 35.88, period: '/month', badge: '40% OFF', badgeColor: 'bg-red-500', recommended: true },
    { id: '3months', title: '3 months', subtitle: '', price: '$3.99', amount: 11.97, period: '/month', badge: '20% OFF', badgeColor: 'bg-red-500', recommended: false },
    { id: '1month', title: '1 month', subtitle: '', price: '$4.99', amount: 4.99, period: '/month', badge: '', badgeColor: '', recommended: false },
    { id: 'lifetime', title: 'Lifetime', subtitle: 'Use forever', price: '$399.99', amount: 399.99, period: '', badge: 'Use forever', badgeColor: 'bg-red-500', recommended: false }
  ];

  // Placeholder for fetchSubscriptionPlans if it's not defined globally
  const fetchSubscriptionPlans = async () => {
    // Mock fetch if not implemented elsewhere
    console.log("Fetching subscription plans...");
  };

  // Placeholder for session if it's not available in the context
  const session = { access_token: 'dummy_access_token' }; // Replace with actual session object

  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Handle auth state changes - auto-proceed with payment after successful Google sign-in
  useEffect(() => {
    if (user && isProcessing && !authError) {
      // User just signed in and we were processing, proceed with payment
      setIsProcessing(false);
      // Small delay to ensure UI updates
      setTimeout(() => {
        handleGetMembership();
      }, 500);
    }
  }, [user, isProcessing, authError]);

  // Check if user is returning from PayPal redirect
  const checkForPayPalReturn = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const payerID = urlParams.get('PayerID');
    const token = urlParams.get('token');

    if (payerID && token) {
      // User returned from PayPal
      const pendingOrder = sessionStorage.getItem('pendingPayPalOrder');

      if (pendingOrder) {
        const orderInfo = JSON.parse(pendingOrder);
        sessionStorage.removeItem('pendingPayPalOrder');

        setIsProcessing(true);

        try {
          // Capture the PayPal order
          const captureResponse = await fetch(`${supabase.supabaseUrl}/functions/v1/paypal-payment?action=capture`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              orderId: orderInfo.orderId
            }),
          });

          const captureResult = await captureResponse.json();

          if (captureResponse.ok && captureResult.status === 'COMPLETED') {
            await handlePaymentSuccess({
              id: captureResult.orderId,
              status: 'COMPLETED',
              paymentMethod: 'paypal',
              amount: orderInfo.amount || 0,
              currency: 'USD'
            });

            alert('PayPal payment successful! Your premium subscription is now active.');

            // Clean up URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            onClose();
          } else {
            alert('Payment verification failed. Please contact support if you completed the payment.');
          }
        } catch (error) {
          console.error('PayPal return capture error:', error);
          alert('Payment verification failed. Please contact support if you completed the payment.');
        } finally {
          setIsProcessing(false);
        }
      }
    }
  };

  // useEffect to fetch plans and check for PayPal return
  useEffect(() => {
    if (isOpen) {
      fetchSubscriptionPlans();
      checkForPayPalReturn();
    }
  }, [isOpen]);

  const handleSubscription = async (planId: string, amount: number) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    setIsProcessing(true);
    try {
      // Create PayPal order
      const createResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          description: planId === 'premium-monthly' ? 'Premium Monthly Subscription' : 'Premium Yearly Subscription',
          planId,
        }),
      });

      const order = await createResponse.json();

      if (order.id) {
        // Redirect to PayPal for payment
        const approvalUrl = order.links.find((link: any) => link.rel === 'approve')?.href;
        if (approvalUrl) {
          // Open PayPal in a new window
          const paypalWindow = window.open(approvalUrl, 'paypal', 'width=600,height=700');

          // Listen for the window to close (payment completion)
          const checkClosed = setInterval(() => {
            if (paypalWindow?.closed) {
              clearInterval(checkClosed);
              // Capture the order
              handlePaymentCapture(order.id, planId);
            }
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
    }
  };

  const handlePaymentCapture = async (orderId: string, planId: string) => {
    try {
      const captureResponse = await fetch('/api/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          planId,
          userId: user.id,
        }),
      });

      const result = await captureResponse.json();

      if (result.status === 'COMPLETED') {
        // Payment successful
        onClose();
        window.location.reload(); // Refresh to update premium status
      }
    } catch (error) {
      console.error('Capture error:', error);
    } finally {
      setIsProcessing(false);
    }
  };


  const plans = [
    {
      id: '2day',
      title: '2-day trial',
      subtitle: 'Limited access',
      price: '$0.99',
      amount: 0.99,
      period: '/2 days',
      badge: 'TRY IT',
      badgeColor: 'bg-red-500',
      recommended: false
    },
    {
      id: '12months',
      title: '12 months',
      subtitle: '',
      price: '$2.99',
      amount: 35.88,
      period: '/month',
      badge: '40% OFF',
      badgeColor: 'bg-red-500',
      recommended: true
    },
    {
      id: '3months',
      title: '3 months',
      subtitle: '',
      price: '$3.99',
      amount: 11.97,
      period: '/month',
      badge: '20% OFF',
      badgeColor: 'bg-red-500',
      recommended: false
    },
    {
      id: '1month',
      title: '1 month',
      subtitle: '',
      price: '$4.99',
      amount: 4.99,
      period: '/month',
      badge: '',
      badgeColor: '',
      recommended: false
    },
    {
      id: 'lifetime',
      title: 'Lifetime',
      subtitle: 'Use forever',
      price: '$399.99',
      amount: 399.99,
      period: '',
      badge: 'Use forever',
      badgeColor: 'bg-red-500',
      recommended: false
    }
  ];

  const selectedPlanData = plans.find(plan => plan.id === selectedPlan);

  // Removed PayPal SDK useEffect - using simple button approach instead

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      // Get current user ID from auth context
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Calculate expiration date based on selected plan
      const now = new Date();
      let expiresAt = new Date();

      switch (selectedPlan) {
        case '2day':
          expiresAt.setDate(now.getDate() + 2);
          break;
        case '1month':
          expiresAt.setMonth(now.getMonth() + 1);
          break;
        case '3months':
          expiresAt.setMonth(now.getMonth() + 3);
          break;
        case '12months':
          expiresAt.setFullYear(now.getFullYear() + 1);
          break;
        case 'lifetime':
          expiresAt.setFullYear(now.getFullYear() + 100); // Set far in the future for lifetime
          break;
        default:
          expiresAt.setMonth(now.getMonth() + 1);
      }

      // Save subscription to Supabase
      const { data: subscription, error: subscriptionError } = await supabase
        .from('premium_subscriptions')
        .upsert({
          user_id: user.id,
          plan_name: selectedPlanData?.title || selectedPlan,
          payment_method: paymentMethod,
          amount: selectedPlanData?.amount || 0,
          currency: 'USD',
          status: 'active',
          payment_id: paymentData.id,
          payment_data: paymentData,
          created_at: now.toISOString(),
          expires_at: expiresAt.toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (subscriptionError) {
        console.error('Supabase error:', subscriptionError);
        throw new Error('Failed to save subscription');
      }

      console.log('Subscription saved to Supabase:', subscription);

      // Show success message and close modal
      alert(`Payment successful! Your ${selectedPlanData?.title} subscription is now active until ${expiresAt.toLocaleDateString()}.`);
      onClose();

      // Refresh the page to update premium status
      window.location.reload();
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  };

  const handlePayPalPayment = async () => {
    if (!user) {
      alert('Please sign in to purchase a subscription');
      return;
    }

    if (!selectedPlan) {
      alert('Please select a subscription plan');
      return;
    }

    setIsProcessing(true);

    try {
      const selectedPlanData = subscriptionPlans.find(plan => plan.id === selectedPlan);

      // Create PayPal order using Supabase function
      const createResponse = await fetch(`${supabase.supabaseUrl}/functions/v1/paypal-payment?action=create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount: selectedPlanData?.amount?.toString() || '0',
          currency: 'USD'
        }),
      });

      const orderResult = await createResponse.json();

      if (!createResponse.ok || orderResult.error) {
        throw new Error(orderResult.error || 'Failed to create PayPal order');
      }

      console.log('PayPal order created:', orderResult);

      // Try popup first, fallback to redirect if blocked
      if (orderResult.approvalUrl) {
        // Try to open PayPal window
        const paypalWindow = window.open(orderResult.approvalUrl, 'paypal-payment', 'width=800,height=700,scrollbars=yes,resizable=yes');

        // Check if popup was blocked
        if (!paypalWindow || paypalWindow.closed || typeof paypalWindow.closed === 'undefined') {
          // Popup blocked - use redirect method instead
          setIsProcessing(false);

          // Store order info in sessionStorage for when user returns
          sessionStorage.setItem('pendingPayPalOrder', JSON.stringify({
            orderId: orderResult.orderId,
            planId: selectedPlan,
            amount: selectedPlanData?.amount
          }));

          // Redirect to PayPal in same window
          window.location.href = orderResult.approvalUrl;
          return;
        }

        // Flag to prevent multiple captures
        let captureAttempted = false;

        // Poll for window closure (indicating payment completion or cancellation)
        const checkClosed = setInterval(async () => {
          if (paypalWindow.closed && !captureAttempted) {
            clearInterval(checkClosed);
            captureAttempted = true;

            try {
              // Small delay to ensure PayPal has processed
              await new Promise(resolve => setTimeout(resolve, 1000));

              // Capture the PayPal order
              const captureResponse = await fetch(`${supabase.supabaseUrl}/functions/v1/paypal-payment?action=capture`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  orderId: orderResult.orderId
                }),
              });

              const captureResult = await captureResponse.json();

              console.log('PayPal capture response:', captureResult);

              if (captureResponse.ok && captureResult.status === 'COMPLETED') {
                // Process successful payment
                await handlePaymentSuccess({
                  id: captureResult.orderId,
                  status: 'COMPLETED',
                  paymentMethod: 'paypal',
                  amount: selectedPlanData?.amount || 0,
                  currency: 'USD'
                });

                alert('PayPal payment successful! Your premium subscription is now active.');
                onClose();
              } else {
                console.log('Payment was not completed or was cancelled');
                alert('Payment was cancelled or not completed. Please try again if you intended to make a payment.');
              }

            } catch (captureError) {
              console.error('PayPal capture error:', captureError);
              alert(`Payment verification failed. If you completed the payment, please contact support. Error: ${captureError.message}`);
            } finally {
              setIsProcessing(false);
            }
          }
        }, 1000);

        // Timeout after 15 minutes
        setTimeout(() => {
          if (!paypalWindow.closed && !captureAttempted) {
            clearInterval(checkClosed);
            captureAttempted = true;
            paypalWindow.close();
            setIsProcessing(false);
            alert('Payment session timed out. Please try again.');
          }
        }, 900000);

      } else {
        throw new Error('PayPal approval URL not received');
      }

    } catch (error) {
      console.error('PayPal payment error:', error);
      alert(`PayPal payment failed: ${error.message}. Please try again.`);
      setIsProcessing(false);
    }
  };

  const handleCreditCardPayment = async () => {
    if (!user) {
      alert('Please sign in to purchase a subscription');
      return;
    }

    setIsProcessing(true);
    try {
      // Handle credit card payment logic here
      // This would typically involve a payment processor like Stripe
      console.log('Processing credit card payment for user:', user.id, { email, selectedPlan });

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate successful payment and process through backend
      await handlePaymentSuccess({ id: `cc_${Date.now()}`, status: 'COMPLETED' });

      alert('Credit card payment successful! Your premium subscription is now active.');
      onClose();
    } catch (error) {
      console.error('Credit card payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCryptoPayment = async () => {
    if (!user) {
      alert('Please sign in to purchase a subscription');
      return;
    }

    setIsProcessing(true);
    try {
      console.log('Processing crypto payment for user:', user.id, { email, selectedPlan });

      // Verify Supabase connection and get authenticated session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.access_token) {
        console.error('Session error:', sessionError);
        throw new Error('Authentication required. Please sign in again.');
      }

      // Verify the user is actually authenticated
      if (!session.user || session.user.aud !== 'authenticated') {
        throw new Error('User not properly authenticated. Please sign in again.');
      }

      console.log('Creating crypto payment request:', {
        action: 'createPayment',
        amount: selectedPlanData?.amount?.toString() || '0',
        currency: selectedCrypto,
        payoutCurrency: 'usd',
        description: `${selectedPlanData?.title} Subscription`,
        returnUrl: window.location.origin,
      });

      // Create crypto payment using Supabase function
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/crypto-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'createPayment',
          amount: selectedPlanData?.amount?.toString() || '0',
          currency: selectedCrypto,
          payoutCurrency: 'usd',
          description: `${selectedPlanData?.title} Subscription`,
          returnUrl: window.location.origin,
        }),
      });

      console.log('Crypto payment response status:', response.status);
      console.log('Crypto payment response ok:', response.ok);

      let result;
      try {
        const responseText = await response.text();
        console.log('Raw response text:', responseText);

        if (!response.ok) {
          console.error('Crypto payment API error:', responseText);

          // Parse error response if it's JSON
          try {
            const errorData = JSON.parse(responseText);
            throw new Error(errorData.error || `API request failed: ${response.status} ${responseText}`);
          } catch (parseError) {
            throw new Error(`API request failed: ${response.status} ${responseText}`);
          }
        }

        result = JSON.parse(responseText);
      } catch (error) {
        if (error.message.includes('API request failed')) {
          throw error;
        }
        console.error('Failed to parse response:', error);
        throw new Error('Invalid response from payment service. Please try again.');
      }

      console.log('Crypto payment result:', result);

      if (!result.success || !result.payment) {
        console.error('Crypto payment failed:', result);
        throw new Error(result.error || 'Failed to create crypto payment');
      }

      const payment = result.payment;

      // Declare cryptoWindow at proper scope for polling functions
      let cryptoWindow: Window | null = null;

      // Check if we have a payment URL or address
      const paymentUrl = payment.pay_url || payment.payment_url || payment.invoice_url;

      if (paymentUrl) {
        console.log('Opening payment URL:', paymentUrl);
        // Open payment URL in new window
        cryptoWindow = window.open(paymentUrl, 'crypto-payment', 'width=800,height=700');
        if (!cryptoWindow) {
          throw new Error('Failed to open payment window. Please allow popups and try again.');
        }
      } else if (payment.pay_address) {
        // For direct crypto payments, show payment details in modal
        console.log('Direct crypto payment details:', payment);
        setCryptoPaymentDetails(payment);
        setShowCryptoModal(true);
      } else {
        console.error('Payment object structure:', payment);
        throw new Error('Payment processor did not provide payment details. Please try a different cryptocurrency or contact support.');
      }

      // Poll for payment completion
      const checkPayment = async () => {
        try {
          const statusResponse = await fetch(`${supabase.supabaseUrl}/functions/v1/crypto-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: 'getPaymentStatus',
              paymentId: payment.payment_id
            }),
          });

          const statusResult = await statusResponse.json();

          if (statusResult.success && statusResult.payment) {
            const paymentStatus = statusResult.payment.payment_status;

            if (paymentStatus === 'finished' || paymentStatus === 'confirmed') {
              clearInterval(pollInterval);
              cryptoWindow?.close();

              // Process successful payment
              await handlePaymentSuccess({
                id: payment.payment_id,
                status: 'COMPLETED',
                paymentMethod: 'crypto'
              });

              alert('Cryptocurrency payment successful! Your premium subscription is now active.');
              onClose();
            } else if (paymentStatus === 'failed' || paymentStatus === 'expired') {
              clearInterval(pollInterval);
              cryptoWindow?.close();
              throw new Error('Payment failed or expired');
            }
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      };

      // Poll every 10 seconds for payment status
      const pollInterval = setInterval(checkPayment, 10000);

      // Stop polling if window is closed manually
      const checkClosed = setInterval(() => {
        if (cryptoWindow?.closed) {
          clearInterval(checkClosed);
          clearInterval(pollInterval);
          setIsProcessing(false);
        }
      }, 1000);

      // Initial check after 3 seconds
      setTimeout(checkPayment, 3000);

    } catch (error) {
      console.error('Crypto payment error:', error);
      console.error('Selected crypto:', selectedCrypto);
      console.error('Amount:', selectedPlanData?.amount);

      let errorMessage = error.message;
      if (errorMessage.includes('payment URL')) {
        errorMessage += ` Try selecting a different cryptocurrency like USDT or Bitcoin.`;
      } else if (errorMessage.includes('Authentication required')) {
        errorMessage = 'Authentication failed. Please sign in again to continue.';
      } else if (errorMessage.includes('User not properly authenticated')) {
        errorMessage = 'Authentication issue. Please sign in again to continue.';
      }


      alert(`Payment failed: ${errorMessage}`);
      setIsProcessing(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError(null);
    setIsProcessing(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setAuthError(error.message);
        setIsProcessing(false);
      }
      // Don't set processing to false here - let the auth state change handle it
    } catch (error) {
      setAuthError('Failed to authenticate with Google');
      setIsProcessing(false);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      setAuthError('Please fill in all fields');
      return;
    }

    setAuthError(null);
    setIsProcessing(true);

    try {
      if (isSignIn) {
        const { error } = await signIn(email, password, 'user');
        if (error) {
          setAuthError(error.message);
          setIsProcessing(false);
          return;
        }
      } else {
        const { error } = await signUp(email, password, 'user');
        if (error) {
          setAuthError(error.message);
          setIsProcessing(false);
          return;
        }
        // Show success message for sign up
        setAuthError('Please check your email to confirm your account before proceeding with payment.');
        setIsProcessing(false);
        return;
      }
    } catch (error: any) {
      setAuthError('An unexpected error occurred');
      setIsProcessing(false);
      return;
    }

    // Continue with payment after successful auth
    handleSubscribe();
  };


  const handleSubscribe = async () => {
    // If user is not authenticated, handle auth first
    if (!user) {
      await handleAuth();
      return;
    }

    setIsProcessing(true);

    try {
      const planAmount = selectedPlanData?.amount;
      if (planAmount === undefined) {
        throw new Error('Selected plan amount is undefined.');
      }

      switch (paymentMethod) {
        case 'creditcard':
          await handleCreditCardPayment();
          break;
        case 'paypal':
          await handlePayPalPayment();
          break;
        case 'crypto':
          await handleCryptoPayment();
          break;
        default:
          throw new Error('Invalid payment method selected.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert(`Subscription failed: ${error.message}. Please try again.`);
      setIsProcessing(false);
    }
  };


  const handleGetMembership = () => {
    if (!user) {
      alert('Please sign in first');
      return;
    }

    // Prevent multiple calls if already processing
    if (isProcessing) {
      return;
    }

    switch (paymentMethod) {
      case 'creditcard':
        handleCreditCardPayment();
        break;
      case 'paypal':
        handlePayPalPayment();
        break;
      case 'crypto':
        handleCryptoPayment();
        break;
    }
  };

  // Function to copy text to clipboard
  const copyToClipboard = async (text: string, message: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        alert(message);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        alert('Could not copy to clipboard automatically. Please copy the address manually.');
      }
    } else {
      // Fallback for non-secure contexts or older browsers
      alert('Could not copy to clipboard automatically. Please copy the address manually.');
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-white text-black p-0 overflow-hidden rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header with background image */}
        <div
          className="relative h-48 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=400&fit=crop')`
          }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/40"></div>

          {/* Header content */}
          <div className="relative h-full flex flex-col justify-between p-4">
            {/* Top bar */}
            <div className="flex justify-between items-center">
              <div className="flex items-center text-white">
                <Crown className="w-6 h-6 text-yellow-400 mr-2" />
                <span className="font-bold">HubX</span>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Sign in button */}
            <div className="flex justify-end">
              {!user && (
                <Button
                  onClick={() => setIsSignIn(!isSignIn)}
                  className="bg-transparent border border-white text-white hover:bg-white hover:text-black px-4 py-2 text-sm"
                >
                  {isSignIn ? "Switch to Sign Up" : "Switch to Sign In"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2">
            Unlock <span className="text-red-500">1,000,000+</span> Full Porn Videos in One Subscription
          </h2>

          <h3 className="text-lg font-semibold mb-4 text-gray-800">Choose a plan</h3>

          {/* Plans */}
          <div className="space-y-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? 'border-yellow-500 bg-yellow-50'
                    : plan.recommended
                    ? 'border-yellow-400 bg-yellow-100'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                {/* Radio button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === plan.id
                        ? 'border-yellow-500 bg-yellow-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedPlan === plan.id && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{plan.title}</span>
                        {plan.badge && (
                          <span className={`px-2 py-1 text-xs text-white rounded ${plan.badgeColor}`}>
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      {plan.subtitle && (
                        <p className="text-sm text-gray-600">{plan.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-lg">{plan.price}</div>
                    {plan.period && (
                      <div className="text-sm text-gray-600">{plan.period}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Methods */}
          <div className="flex space-x-2 mb-4 mt-4">
            <Button
              onClick={() => setPaymentMethod('creditcard')}
              className={`flex-1 text-sm py-2 ${
                paymentMethod === 'creditcard'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Credit card
            </Button>
            <Button
              onClick={() => setPaymentMethod('paypal')}
              className={`flex-1 text-sm py-2 ${
                paymentMethod === 'paypal'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              PayPal
            </Button>
            <Button
              onClick={() => setPaymentMethod('crypto')}
              className={`flex-1 text-sm py-2 ${
                paymentMethod === 'crypto'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cryptocoins
            </Button>
          </div>

          {/* Cryptocurrency Selection */}
          {paymentMethod === 'crypto' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Cryptocurrency
              </label>
              <select
                className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={selectedCrypto}
                onChange={(e) => setSelectedCrypto(e.target.value)}
              >
                <option value="btc">Bitcoin (BTC)</option>
                <option value="eth">Ethereum (ETH)</option>
                <option value="usdt">Tether (USDT)</option>
                <option value="usdc">USD Coin (USDC)</option>
                <option value="bnb">Binance Coin (BNB)</option>
                <option value="ada">Cardano (ADA)</option>
                <option value="dot">Polkadot (DOT)</option>
                <option value="ltc">Litecoin (LTC)</option>
              </select>
            </div>
          )}

          {/* Trust Badge */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center text-green-600 text-xs">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              No adult related transaction in your bank statement
            </div>
          </div>

          {/* Create Account Section */}
          {!user && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-1">
                {isSignIn ? 'Sign In to your account' : 'Create account'}
              </h3>

              {/* Google Sign Up */}
              <Button onClick={handleGoogleAuth} className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 mb-3 py-3">
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </Button>

              <div className="text-center text-gray-500 text-sm mb-3">
                or continue with email
              </div>

              {/* Email and Password Form */}
              <div className="space-y-3">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                  <input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-10 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                  </svg>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-10 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
              {authError && <p className="text-red-500 text-xs mt-2">{authError}</p>}
              <div className="text-xs text-gray-500 mt-3">
                By creating account, you agree to our <span className="text-blue-500">Terms and Conditions</span> & <span className="text-blue-500">Privacy Policy</span>
              </div>
            </div>
          )}


          {/* PayPal Payment Info */}
          {paymentMethod === 'paypal' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center text-blue-700 text-sm mb-1">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.26-.93 4.778-4.005 6.346-7.837 6.346h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106h4.608a.641.641 0 0 0 .633-.74l1.120-7.106c.082-.518.526-.9 1.05-.9h2.19c3.498 0 6.234-1.42 7.08-5.525.061-.296.108-.594.146-.894a6.024 6.024 0 0 0-2.982-1.906z"/>
                </svg>
                PayPal Payment
              </div>
              <p className="text-blue-600 text-xs">
                Payment will open in a popup window. If popups are blocked, you'll be redirected to PayPal in the same tab.
              </p>
            </div>
          )}

          {/* Crypto Payment Info */}
          {paymentMethod === 'crypto' && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center text-orange-700 text-sm mb-1">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Cryptocurrency Payment
              </div>
              <p className="text-orange-600 text-xs">
                You will be redirected to complete your {selectedCrypto.toUpperCase()} payment.
                The payment window will close automatically when completed.
              </p>
            </div>
          )}

          {/* Continue button - Show for all payment methods */}
          <Button
            onClick={user ? handleGetMembership : handleAuth}
            disabled={isProcessing}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg py-4 rounded-lg disabled:opacity-50"
          >
            {isProcessing ? 'PROCESSING...' :
             user ? `Get Membership - ${selectedPlanData?.price}` :
             isSignIn ? 'Sign In & Get Membership' : `Create Account & Get Membership`}
          </Button>

          {/* Footer text */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Payments are processed by <span className="text-green-600 font-semibold">EPOCH</span>. Billed as ${selectedPlanData?.amount || '35.88'}<br />
            {selectedPlan === '12months' && 'Followed by a payment of $35.88 after 12 months.'}
          </p>
        </div>
      </DialogContent>
    </Dialog>

    {/* Crypto Payment Modal */}
    <Dialog open={showCryptoModal} onOpenChange={(open) => { setShowCryptoModal(open); if (!open) setCryptoPaymentDetails(null); }}>
      <DialogContent className="max-w-4xl mx-auto bg-white text-black p-6 rounded-2xl">
        {cryptoPaymentDetails ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Complete Your Crypto Payment</h2>
              <button onClick={() => { setShowCryptoModal(false); setCryptoPaymentDetails(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-semibold">Amount to Pay:</span>
                <span className="text-lg font-bold text-orange-600">{cryptoPaymentDetails.pay_amount} {cryptoPaymentDetails.pay_currency.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-semibold">Approx. USD Value:</span>
                <span className="text-lg font-bold">${cryptoPaymentDetails.price_amount}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-semibold">Payment Address:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-md font-mono bg-gray-200 px-2 py-1 rounded break-all">{cryptoPaymentDetails.pay_address}</span>
                  <Button onClick={() => copyToClipboard(cryptoPaymentDetails.pay_address, 'Payment address copied to clipboard!')} className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-1">Copy</Button>
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-semibold">Valid Until:</span>
                <span className="text-md text-gray-700">{new Date(cryptoPaymentDetails.expiration_estimate_date).toLocaleString()}</span>
              </div>
              <div className="mt-5 text-center text-sm text-gray-600">
                Please send the exact amount to the address above. Your subscription will be activated once the payment is confirmed.
              </div>
            </div>
            <div className="mt-6 text-center">
              <Button onClick={() => copyToClipboard(cryptoPaymentDetails.pay_address, 'Payment address copied to clipboard!')} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg mr-3">
                Copy Address
              </Button>
              <Button onClick={() => { setShowCryptoModal(false); setCryptoPaymentDetails(null); }} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg">
                Close
              </Button>
            </div>
          </>
        ) : (
          <p>Loading payment details...</p>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
};

export default SubscriptionModal;