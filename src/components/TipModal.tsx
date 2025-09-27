
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
        <DialogContent className="max-w-md bg-black/70 backdrop-blur-xl border border-gray-700/30 text-white shadow-2xl">
          <DialogHeader className="pb-6 border-b border-gray-700/30">
            <DialogTitle className="text-white flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent font-semibold">
                Tip {creatorName}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-600/30 border-t-yellow-400"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-black/70 backdrop-blur-xl border border-gray-700/30 text-white shadow-2xl">
        <DialogHeader className="pb-6 border-b border-gray-700/30">
          <DialogTitle className="text-white flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-yellow-400" />
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent font-semibold">
              Tip {creatorName}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-6">
          <p className="text-gray-200 text-sm leading-relaxed">{tipDetails.description}</p>
          <div className="space-y-3">
            {tipDetails.paypal && (
              <div className="flex items-center justify-between p-4 bg-gray-800/40 backdrop-blur-sm border border-gray-600/30 rounded-xl transition-all duration-200 hover:bg-gray-700/40 hover:border-blue-500/30">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-medium">PayPal</span>
                </div>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-200 rounded-lg px-4 py-2"
                  onClick={() => window.open(`https://paypal.me/${tipDetails.paypal}`, '_blank')}
                >
                  Send Tip
                </Button>
              </div>
            )}
            {tipDetails.venmo && (
              <div className="flex items-center justify-between p-4 bg-gray-800/40 backdrop-blur-sm border border-gray-600/30 rounded-xl transition-all duration-200 hover:bg-gray-700/40 hover:border-blue-400/30">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-medium">Venmo</span>
                </div>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-400/25 transition-all duration-200 rounded-lg px-4 py-2"
                  onClick={() => window.open(`https://venmo.com/${tipDetails.venmo}`, '_blank')}
                >
                  Send Tip
                </Button>
              </div>
            )}
            {tipDetails.cashapp && (
              <div className="flex items-center justify-between p-4 bg-gray-800/40 backdrop-blur-sm border border-gray-600/30 rounded-xl transition-all duration-200 hover:bg-gray-700/40 hover:border-green-500/30">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-medium">Cash App</span>
                </div>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-green-500/25 transition-all duration-200 rounded-lg px-4 py-2"
                  onClick={() => window.open(`https://cash.app/$${tipDetails.cashapp}`, '_blank')}
                >
                  Send Tip
                </Button>
              </div>
            )}
            {tipDetails.bitcoin && (
              <div className="p-4 bg-gray-800/40 backdrop-blur-sm border border-gray-600/30 rounded-xl">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-medium">Bitcoin</span>
                </div>
                <div className="bg-gray-700/60 backdrop-blur-sm p-3 rounded-lg text-xs text-gray-200 break-all font-mono border border-gray-600/30">
                  {tipDetails.bitcoin}
                </div>
              </div>
            )}
            {tipDetails.ethereum && (
              <div className="p-4 bg-gray-800/40 backdrop-blur-sm border border-gray-600/30 rounded-xl">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center shadow-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-medium">Ethereum</span>
                </div>
                <div className="bg-gray-700/60 backdrop-blur-sm p-3 rounded-lg text-xs text-gray-200 break-all font-mono border border-gray-600/30">
                  {tipDetails.ethereum}
                </div>
              </div>
            )}
            {!tipDetails.paypal && !tipDetails.venmo && !tipDetails.cashapp && !tipDetails.bitcoin && !tipDetails.ethereum && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-gray-600/30">
                  <DollarSign className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-300 font-medium">No tip methods available</p>
                <p className="text-sm text-gray-400 mt-2">Creator hasn't set up tip details yet</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TipModal;
