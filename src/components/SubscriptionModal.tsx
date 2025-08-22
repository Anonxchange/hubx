import React, { useState, useEffect, useRef } from 'react';
import { X, Crown } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

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

  const plans = [
    { id: '2day', title: '2-day trial', subtitle: 'Limited access', price: '$0.99', amount: 0.99, period: '/2 days', badge: 'TRY IT', badgeColor: 'bg-red-500', recommended: false },
    { id: '12months', title: '12 months', subtitle: '', price: '$2.99', amount: 35.88, period: '/month', badge: '40% OFF', badgeColor: 'bg-red-500', recommended: true },
    { id: '3months', title: '3 months', subtitle: '', price: '$3.99', amount: 11.97, period: '/month', badge: '20% OFF', badgeColor: 'bg-red-500', recommended: false },
    { id: '1month', title: '1 month', subtitle: '', price: '$4.99', amount: 4.99, period: '/month', badge: '', badgeColor: '', recommended: false },
    { id: 'lifetime', title: 'Lifetime', subtitle: 'Use forever', price: '$399.99', amount: 399.99, period: '', badge: 'Use forever', badgeColor: 'bg-red-500', recommended: false },
  ];

  const selectedPlanData = plans.find(plan => plan.id === selectedPlan);

  // Function to call Supabase function
  const callQuickResponder = async (payload: any) => {
    try {
      const res = await fetch('https://rhahzghkbbiujxjhunob.supabase.co/functions/v1/quick-responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log('Quick responder response:', data);
      return data;
    } catch (err) {
      console.error('Error calling quick-responder:', err);
    }
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Send payment data to your backend
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentData, email, selectedPlan, paymentMethod, userId: user.id })
      });

      if (!response.ok) throw new Error('Payment verification failed');
      const result = await response.json();
      console.log('Payment verified:', result);

      // Call Supabase function
      await callQuickResponder({
        userId: user.id,
        email,
        plan: selectedPlan,
        paymentMethod,
        paymentStatus: paymentData.status
      });

      alert(`Payment successful! Your ${result.subscription.plan_name} subscription is now active.`);
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  };

  // PayPal Integration
  useEffect(() => {
    if (isOpen && paymentMethod === 'paypal' && paypalRef.current && selectedPlanData) {
      paypalRef.current.innerHTML = '';
      const initPayPal = () => {
        if (!window.paypal) return setTimeout(initPayPal, 100);
        window.paypal.Buttons({
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                amount: { value: selectedPlanData.amount.toString() },
                description: `HubX Premium - ${selectedPlanData.title}`
              }]
            });
          },
          onApprove: async (data: any, actions: any) => {
            setIsProcessing(true);
            try {
              const order = await actions.order.capture();
              await handlePaymentSuccess(order);
            } catch (error) {
              console.error('PayPal payment error:', error);
              alert('Payment failed. Please try again.');
            } finally {
              setIsProcessing(false);
            }
          },
          onError: (err: any) => {
            console.error('PayPal error:', err);
            alert('Payment failed. Please try again.');
            setIsProcessing(false);
          },
          style: { color: 'gold', shape: 'rect', label: 'paypal', layout: 'vertical' }
        }).render(paypalRef.current);
      };
      initPayPal();
    }
  }, [isOpen, paymentMethod, selectedPlan, selectedPlanData]);

  const handleCreditCardPayment = async () => {
    if (!email || !password) { alert('Please fill in all required fields'); return; }
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // simulate processing
      await handlePaymentSuccess({ id: `cc_${Date.now()}`, status: 'COMPLETED' });
    } catch (error) {
      console.error('Credit card payment error:', error);
      alert('Payment failed. Please try again.');
    } finally { setIsProcessing(false); }
  };

  const handleCryptoPayment = async () => {
    if (!email || !password) { alert('Please fill in all required fields'); return; }
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // simulate processing
      await handlePaymentSuccess({ id: `crypto_${Date.now()}`, status: 'COMPLETED' });
    } catch (error) {
      console.error('Crypto payment error:', error);
      alert('Payment failed. Please try again.');
    } finally { setIsProcessing(false); }
  };

  const handleGetMembership = () => {
    switch (paymentMethod) {
      case 'creditcard': handleCreditCardPayment(); break;
      case 'crypto': handleCryptoPayment(); break;
      case 'paypal': break; // handled by PayPal button
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-white text-black p-0 overflow-hidden rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative h-48 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=400&fit=crop')` }}>
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="relative h-full flex flex-col justify-between p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center text-white"><Crown className="w-6 h-6 text-yellow-400 mr-2" />HubX</div>
              <button onClick={onClose} className="text-white hover:text-gray-300"><X className="w-6 h-6" /></button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2">Unlock <span className="text-red-500">1,000,000+</span> Full Porn Videos in One Subscription</h2>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Choose a plan</h3>

          <div className="space-y-3">
            {plans.map(plan => (
              <div key={plan.id} onClick={() => setSelectedPlan(plan.id)} className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedPlan === plan.id ? 'border-yellow-500 bg-yellow-50' : plan.recommended ? 'border-yellow-400 bg-yellow-100' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === plan.id ? 'border-yellow-500 bg-yellow-500' : 'border-gray-300'}`}>
                      {selectedPlan === plan.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{plan.title}</span>
                        {plan.badge && <span className={`px-2 py-1 text-xs text-white rounded ${plan.badgeColor}`}>{plan.badge}</span>}
                      </div>
                      {plan.subtitle && <p className="text-sm text-gray-600">{plan.subtitle}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{plan.price}</div>
                    {plan.period && <div className="text-sm text-gray-600">{plan.period}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment methods */}
          <div className="flex space-x-2 mb-4 mt-4">
            <Button onClick={() => setPaymentMethod('creditcard')} className={`flex-1 text-sm py-2 ${paymentMethod === 'creditcard' ? 'bg-yellow-500 text-black' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Credit card</Button>
            <Button onClick={() => setPaymentMethod('paypal')} className={`flex-1 text-sm py-2 ${paymentMethod === 'paypal' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>PayPal</Button>
            <Button onClick={() => setPaymentMethod('crypto')} className={`flex-1 text-sm py-2 ${paymentMethod === 'crypto' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Cryptocoins</Button>
          </div>

          {paymentMethod === 'paypal' && <div ref={paypalRef} className="w-full min-h-[120px] flex items-center justify-center">{!window.paypal && <div className="text-center text-gray-500">Loading PayPal...</div>}</div>}
          {paymentMethod !== 'paypal' && <Button onClick={handleGetMembership} disabled={isProcessing} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg py-4 rounded-lg disabled:opacity-50">{isProcessing ? 'PROCESSING...' : 'GET MEMBERSHIP'}</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;