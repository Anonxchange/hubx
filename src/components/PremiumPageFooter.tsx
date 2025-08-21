
import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, DollarSign, Shield, Star, User, Heart, Settings, Play, Video } from 'lucide-react';

const PremiumPageFooter = () => {
  return (
    <footer className="bg-black border-t border-gray-800 mt-8">
      <div className="container mx-auto px-4 py-8">
        {/* Premium Earnings Banner */}
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-6 h-6 text-black" />
              <div>
                <h3 className="text-black font-bold text-lg">Start earning money</h3>
                <p className="text-black/80 text-sm">Open a studio and earn on selling content</p>
              </div>
            </div>
            <Link
              to="/become-model"
              className="bg-black text-yellow-400 px-4 py-2 rounded-lg font-medium hover:bg-gray-900 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Footer Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* General */}
          <div className="space-y-4">
            <h4 className="font-semibold text-yellow-400 text-sm">General</h4>
            <div className="flex flex-col space-y-3">
              <Link to="/premium" className="text-gray-300 hover:text-white text-sm transition-colors">
                Join
              </Link>
              <Link to="/auth" className="text-gray-300 hover:text-white text-sm transition-colors">
                Member Sign In
              </Link>
              <Link to="/auth?tab=reset" className="text-gray-300 hover:text-white text-sm transition-colors">
                Password Recovery
              </Link>
              <Link to="/blog" className="text-gray-300 hover:text-white text-sm transition-colors">
                Creator's Blog
              </Link>
              <Link to="/" className="text-gray-300 hover:text-white text-sm transition-colors">
                Desktop version
              </Link>
            </div>
          </div>

          {/* Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-yellow-400 text-sm">Information</h4>
            <div className="flex flex-col space-y-3">
              <Link to="/terms" className="text-gray-300 hover:text-white text-sm transition-colors">
                Terms of Use
              </Link>
              <Link to="/privacy" className="text-gray-300 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="/cookies" className="text-gray-300 hover:text-white text-sm transition-colors">
                Cookies Policy
              </Link>
              <Link to="/safety" className="text-gray-300 hover:text-white text-sm transition-colors">
                Trust and Safety
              </Link>
              <Link to="/dsa" className="text-gray-300 hover:text-white text-sm transition-colors">
                EU DSA
              </Link>
              <Link to="/dmca" className="text-gray-300 hover:text-white text-sm transition-colors">
                DMCA Policy
              </Link>
            </div>
          </div>

          {/* Help & Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-yellow-400 text-sm">Help & Support</h4>
            <div className="flex flex-col space-y-3">
              <Link to="/contact" className="text-gray-300 hover:text-white text-sm transition-colors">
                Contact Us
              </Link>
              <Link to="/billing-support" className="text-gray-300 hover:text-white text-sm transition-colors">
                Billing Support
              </Link>
              <Link to="/faq" className="text-gray-300 hover:text-white text-sm transition-colors">
                FAQ
              </Link>
              <Link to="/about" className="text-gray-300 hover:text-white text-sm transition-colors">
                About Us
              </Link>
              <Link to="/report" className="text-gray-300 hover:text-white text-sm transition-colors">
                Report content
              </Link>
              <Link to="/vr-guide" className="text-gray-300 hover:text-white text-sm transition-colors">
                How to Watch VR Videos
              </Link>
            </div>
          </div>

          {/* Earn with us */}
          <div className="space-y-4">
            <h4 className="font-semibold text-yellow-400 text-sm">Earn with us</h4>
            <div className="flex flex-col space-y-3">
              <Link to="/studio" className="text-gray-300 hover:text-white text-sm transition-colors">
                Open a Studio
              </Link>
              <Link to="/creator-signin" className="text-gray-300 hover:text-white text-sm transition-colors">
                Creator Sign In
              </Link>
              <Link to="/affiliate" className="text-gray-300 hover:text-white text-sm transition-colors">
                Affiliate program
              </Link>
            </div>
          </div>
        </div>

        {/* Compliance Statement */}
        <div className="border-t border-gray-800 pt-6 mb-6">
          <p className="text-gray-400 text-xs leading-relaxed">
            <Link to="/compliance" className="underline hover:text-white transition-colors">
              18 U.S.C. 2257 Record-Keeping Requirements Compliance Statement
            </Link>
          </p>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-400 text-sm">© 2021-2025 hubx.com</span>
            </div>
            
            {/* Premium Features */}
            <div className="flex items-center space-x-6 text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-yellow-400" />
                <span>4K Ultra HD</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className="w-3 h-3 text-green-400" />
                <span>Ad-Free</span>
              </div>
              <div className="flex items-center space-x-1">
                <Crown className="w-3 h-3 text-yellow-400" />
                <span>Exclusive Content</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PremiumPageFooter;
