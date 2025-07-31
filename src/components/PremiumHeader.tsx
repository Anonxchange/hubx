
import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Search, Bell, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PremiumHeader = () => {
  return (
    <header className="bg-gradient-to-r from-purple-900 via-black to-purple-900 text-white sticky top-0 z-50 border-b border-purple-500/20">
      {/* Top bar with premium features */}
      <div className="border-b border-purple-500/20 bg-black/30">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>🔴 Live</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>💬 VIP Chat</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🥽 VR Premium</span>
                <div className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">ON</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">VIP Member</span>
              </div>
              <Button size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold">
                Join -50%
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <Crown className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
                PREMIUM
              </span>
            </Link>
            
            <nav className="flex items-center space-x-6">
              <Link to="/premium" className="flex items-center space-x-2 text-yellow-400 border-b-2 border-yellow-400 pb-1">
                <Crown className="w-4 h-4" />
                <span className="font-semibold">Premium Videos</span>
              </Link>
              <Link to="/category/vr" className="hover:text-purple-300 transition-colors">VR Premium</Link>
              <Link to="/category/exclusive" className="hover:text-purple-300 transition-colors">Exclusive</Link>
              <Link to="/category/4k" className="hover:text-purple-300 transition-colors">4K Ultra</Link>
              <Link to="/category/live" className="hover:text-purple-300 transition-colors">Live Shows</Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search premium content..."
                className="bg-black/50 border border-purple-500/30 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-purple-400 w-64"
              />
            </div>
            <div className="relative">
              <Bell className="w-5 h-5 hover:text-purple-300 cursor-pointer" />
              <Badge variant="destructive" className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs p-0">
                3
              </Badge>
            </div>
            <User className="w-5 h-5 hover:text-purple-300 cursor-pointer" />
            <Settings className="w-5 h-5 hover:text-purple-300 cursor-pointer" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default PremiumHeader;
