import React, { useState, useEffect, useRef } from 'react';
import { X, Crown, Check } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  const paypalRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();

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

  useEffect(() => {
    let isComponentMounted = true;
    
    if (isOpen && paymentMethod === 'paypal' && paypalRef.current && selectedPlanData && user) {
      // Clear previous PayPal buttons
      paypalRef.current.innerHTML = '';

      // Wait for PayPal SDK to load
      const initPayPal = () => {
        if (!isComponentMounted) return;
        if (!window.paypal) {
          console.log('PayPal SDK not loaded, retrying...');
          setTimeout(initPayPal, 500);
          return;
        }

        console.log('Initializing PayPal buttons...');

        window.paypal.Buttons({
          createOrder: (data: any, actions: any) => {
            console.log('Creating PayPal order...');
            // Create order through unified Supabase Edge Function
            return fetch(`${supabase.supabaseUrl}/functions/v1/paypal-payments`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabase.supabaseKey}`,
              },
              body: JSON.stringify({
                action: 'create',
                amount: selectedPlanData.amount,
                description: `HubX Premium - ${selectedPlanData.title}`,
              }),
            }).then(res => res.json()).then(order => order.id);
          },
          onApprove: async (data: any, actions: any) => {
            setIsProcessing(true);
            try {
              console.log('PayPal payment approved, capturing order...');
              // Capture order through unified Supabase Edge Function
              const response = await fetch(`${supabase.supabaseUrl}/functions/v1/paypal-payments`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabase.supabaseKey}`,
                },
                body: JSON.stringify({
                  action: 'capture',
                  orderId: data.orderID,
                  planId: selectedPlan,
                  userId: user?.id,
                }),
              });
              const result = await response.json();

              console.log('PayPal payment successful:', result);

              await handlePaymentSuccess(result);
              alert('Payment successful! Your premium subscription is now active.');
              onClose();
            } catch (error) {
              console.error('PayPal payment error:', error);
              alert('Payment failed. Please try again.');
            } finally {
              setIsProcessing(false);
            }
          },
          onCancel: (data: any) => {
            console.log('PayPal payment cancelled:', data);
            setIsProcessing(false);
          },
          onError: (err: any) => {
            console.error('PayPal error:', err);
            alert('Payment failed. Please try again.');
            setIsProcessing(false);
          },
          style: {
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
            layout: 'vertical',
            height: 45
          }
        }).render(paypalRef.current).then(() => {
          console.log('PayPal buttons rendered successfully');
        }).catch((error: any) => {
          console.error('PayPal render error:', error);
        });
      };

      // Add a small delay to ensure DOM is ready
      setTimeout(initPayPal, 100);
    }

    return () => {
      isComponentMounted = false;
      if (paypalRef.current) {
        paypalRef.current.innerHTML = '';
      }
    };
  }, [isOpen, paymentMethod, selectedPlan, selectedPlanData?.amount, user?.id]);

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
          plan_type: selectedPlan,
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

  const handleCreditCardPayment = async () => {
    if (!email || !password) {
      alert('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    try {
      // Handle credit card payment logic here
      // This would typically involve a payment processor like Stripe
      console.log('Processing credit card payment for:', { email, selectedPlan });

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
    if (!email || !password) {
      alert('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    try {
      // Handle cryptocurrency payment logic here
      console.log('Processing crypto payment for:', { email, selectedPlan });

      // This would typically redirect to a crypto payment processor
      alert('Redirecting to cryptocurrency payment processor...');

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate successful payment and process through backend
      await handlePaymentSuccess({ id: `crypto_${Date.now()}`, status: 'COMPLETED' });

      alert('Cryptocurrency payment successful! Your premium subscription is now active.');
      onClose();
    } catch (error) {
      console.error('Crypto payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGetMembership = () => {
    switch (paymentMethod) {
      case 'creditcard':
        handleCreditCardPayment();
        break;
      case 'paypal':
        // PayPal payment is handled by the PayPal button
        break;
      case 'crypto':
        handleCryptoPayment();
        break;
    }
  };

  return (
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
              <Button className="bg-transparent border border-white text-white hover:bg-white hover:text-black px-4 py-2 text-sm">
                SIGN IN
              </Button>
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
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-1">Create account or <span className="text-blue-500">Sign in</span></h3>

            {/* Google Sign Up */}
            <Button className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 mb-3 py-3">
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

            <div className="text-xs text-gray-500 mt-3">
              By creating account, you agree to our <span className="text-blue-500">Terms and Conditions</span> & <span className="text-blue-500">Privacy Policy</span>
            </div>
          </div>

          {/* PayPal Button Container */}
          {paymentMethod === 'paypal' && (
            <div className="mb-4">
              <div className="text-center text-sm text-gray-600 mb-2">
                Complete your payment with PayPal
              </div>
              <div 
                ref={paypalRef} 
                className="w-full min-h-[60px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center"
                style={{ minHeight: '60px' }}
              >
                <div className="text-center text-gray-500 text-sm">
                  Loading PayPal buttons...
                </div>
              </div>
            </div>
          )}

          {/* Continue button - Only show for non-PayPal payments */}
          {paymentMethod !== 'paypal' && (
            <Button 
              onClick={handleGetMembership}
              disabled={isProcessing}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg py-4 rounded-lg disabled:opacity-50"
            >
              {isProcessing ? 'PROCESSING...' : 'GET MEMBERSHIP'}
            </Button>
          )}

          {/* Footer text */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Payments are processed by <span className="text-green-600 font-semibold">EPOCH</span>. Billed as ${selectedPlanData?.amount || '35.88'}<br />
            {selectedPlan === '12months' && 'Followed by a payment of $35.88 after 12 months.'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;