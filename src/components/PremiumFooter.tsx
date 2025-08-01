
import React from 'react';
import { Crown, Shield, Star } from 'lucide-react';

const PremiumFooter = () => {
  return (
    <footer className="bg-gradient-to-r from-purple-900 via-black to-purple-900 text-white border-t border-purple-500/20 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Premium Brand */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-yellow-400" />
              <span className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
                PREMIUM
              </span>
            </div>
            <p className="text-gray-300 text-sm">
              Exclusive premium content collection with 4K quality and ad-free experience.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-yellow-400">Premium Features</h3>
            <div className="flex flex-wrap gap-4 text-sm text-gray-300">
              <span className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-purple-400" />
                <span>4K Ultra HD</span>
              </span>
              <span className="flex items-center space-x-1">
                <Shield className="w-3 h-3 text-green-400" />
                <span>Ad-Free</span>
              </span>
              <span className="flex items-center space-x-1">
                <Crown className="w-3 h-3 text-yellow-400" />
                <span>Exclusive</span>
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-purple-500/20 mt-4 pt-4 text-center">
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
            <span>© 2024 Premium Platform</span>
            <div className="flex items-center space-x-1">
              <Crown className="w-3 h-3 text-yellow-400" />
              <span>Premium Certified</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PremiumFooter;
