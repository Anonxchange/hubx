
import React, { useState } from 'react';
import { X, Crown, Check } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState('12months');

  const plans = [
    {
      id: '2day',
      title: '2-day trial',
      subtitle: 'Limited access',
      price: '$0.99',
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
      period: '',
      badge: 'Use forever',
      badgeColor: 'bg-red-500',
      recommended: false
    }
  ];

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
          
          {/* Continue button */}
          <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg py-4 mt-6 rounded-lg">
            Continue
          </Button>
          
          {/* Footer text */}
          <p className="text-xs text-gray-500 text-center mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;
