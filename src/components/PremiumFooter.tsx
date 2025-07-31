
import React from 'react';
import { Crown, Shield, Zap, Star } from 'lucide-react';

const PremiumFooter = () => {
  return (
    <footer className="bg-gradient-to-r from-purple-900 via-black to-purple-900 text-white border-t border-purple-500/20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Premium Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Crown className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
                PREMIUM
              </span>
            </div>
            <p className="text-gray-300 text-sm">
              The ultimate destination for exclusive, high-quality premium content. Experience luxury entertainment like never before.
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">VIP Quality</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm">Secure</span>
              </div>
            </div>
          </div>

          {/* Premium Features */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-yellow-400">Premium Features</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center space-x-2">
                <Zap className="w-3 h-3 text-purple-400" />
                <span>4K Ultra HD Quality</span>
              </li>
              <li className="flex items-center space-x-2">
                <Zap className="w-3 h-3 text-purple-400" />
                <span>Ad-Free Experience</span>
              </li>
              <li className="flex items-center space-x-2">
                <Zap className="w-3 h-3 text-purple-400" />
                <span>Exclusive Content</span>
              </li>
              <li className="flex items-center space-x-2">
                <Zap className="w-3 h-3 text-purple-400" />
                <span>VR Premium Access</span>
              </li>
              <li className="flex items-center space-x-2">
                <Zap className="w-3 h-3 text-purple-400" />
                <span>Early Access</span>
              </li>
            </ul>
          </div>

          {/* VIP Support */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-yellow-400">VIP Support</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>24/7 Premium Support</li>
              <li>Priority Customer Service</li>
              <li>Dedicated Account Manager</li>
              <li>Premium Community Access</li>
              <li>Exclusive Events & Shows</li>
            </ul>
          </div>

          {/* Legal & Security */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-yellow-400">Security & Legal</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Premium Privacy Policy</li>
              <li>VIP Terms of Service</li>
              <li>Secure Payment Processing</li>
              <li>Content Protection</li>
              <li>DMCA Compliance</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-purple-500/20 mt-8 pt-8 text-center">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
            <span>© 2024 Premium Platform. All rights reserved.</span>
            <div className="flex items-center space-x-1">
              <Shield className="w-4 h-4" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center space-x-1">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span>Premium Certified</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PremiumFooter;
