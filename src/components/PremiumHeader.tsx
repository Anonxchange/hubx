
import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Search, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PremiumHeader = () => {
  return (
    <header className="bg-gradient-to-r from-purple-900 via-black to-purple-900 text-white sticky top-0 z-50 border-b border-purple-500/20">
      {/* Top premium bar - mobile optimized */}
      <div className="border-b border-purple-500/20 bg-black/30">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="hidden sm:inline">🔴 Live</span>
                <span className="sm:hidden">🔴</span>
              </div>
              <div className="hidden sm:flex items-center space-x-2">
                <span>💬 VIP</span>
              </div>
            </div>
            <Button size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold text-xs px-2 py-1">
              Join -50%
            </Button>
          </div>
        </div>
      </div>

      {/* Main navigation - simplified */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Crown className="w-6 h-6 text-yellow-400" />
            <span className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
              PREMIUM
            </span>
          </Link>

          <div className="flex items-center space-x-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search premium..."
                className="bg-black/50 border border-purple-500/30 rounded-full pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-purple-400 w-48"
              />
            </div>
            <Search className="w-5 h-5 hover:text-purple-300 cursor-pointer sm:hidden" />
            <User className="w-5 h-5 hover:text-purple-300 cursor-pointer" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default PremiumHeader;
