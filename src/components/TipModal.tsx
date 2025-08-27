
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId?: string;
  creatorName: string;
}

interface TipDetails {
  paypal: string;
  venmo: string;
  cashapp: string;
  bitcoin: string;
  ethereum: string;
  description: string;
}

const TipModal: React.FC<TipModalProps> = ({ isOpen, onClose, creatorId, creatorName }) => {
  const [tipDetails, setTipDetails] = useState<TipDetails>({
    paypal: '',
    venmo: '',
    cashapp: '',
    bitcoin: '',
    ethereum: '',
    description: 'Support my content creation journey! 💖'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTipDetails = async () => {
      if (!creatorId || !isOpen) return;

      setLoading(true);
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('tip_paypal, tip_venmo, tip_cashapp, tip_bitcoin, tip_ethereum, tip_description')
          .eq('id', creatorId)
          .single();

        if (profile && !error) {
          setTipDetails({
            paypal: profile.tip_paypal || '',
            venmo: profile.tip_venmo || '',
            cashapp: profile.tip_cashapp || '',
            bitcoin: profile.tip_bitcoin || '',
            ethereum: profile.tip_ethereum || '',
            description: profile.tip_description || 'Support my content creation journey! 💖'
          });
        }
      } catch (error) {
        console.error('Error fetching tip details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTipDetails();
  }, [creatorId, isOpen]);

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-orange-500" />
              <span>Tip {creatorName}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-orange-500" />
            <span>Tip {creatorName}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">{tipDetails.description}</p>
          <div className="space-y-3">
            {tipDetails.paypal && (
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-medium">PayPal</span>
                </div>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => window.open(`https://paypal.me/${tipDetails.paypal}`, '_blank')}
                >
                  Send Tip
                </Button>
              </div>
            )}
            {tipDetails.venmo && (
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-medium">Venmo</span>
                </div>
                <Button
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => window.open(`https://venmo.com/${tipDetails.venmo}`, '_blank')}
                >
                  Send Tip
                </Button>
              </div>
            )}
            {tipDetails.cashapp && (
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-medium">Cash App</span>
                </div>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => window.open(`https://cash.app/$${tipDetails.cashapp}`, '_blank')}
                >
                  Send Tip
                </Button>
              </div>
            )}
            {tipDetails.bitcoin && (
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-medium">Bitcoin</span>
                </div>
                <div className="bg-gray-700 p-2 rounded text-xs text-gray-300 break-all">
                  {tipDetails.bitcoin}
                </div>
              </div>
            )}
            {tipDetails.ethereum && (
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-medium">Ethereum</span>
                </div>
                <div className="bg-gray-700 p-2 rounded text-xs text-gray-300 break-all">
                  {tipDetails.ethereum}
                </div>
              </div>
            )}
            {!tipDetails.paypal && !tipDetails.venmo && !tipDetails.cashapp && !tipDetails.bitcoin && !tipDetails.ethereum && (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">No tip methods available</p>
                <p className="text-sm text-gray-500 mt-2">Creator hasn't set up tip details yet</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TipModal;
