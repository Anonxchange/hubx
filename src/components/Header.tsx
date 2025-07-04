
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Search, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const categories = [
  'Big Ass', 'Big Tits', 'Ebony', 'MILF', 'Lesbian', 'Teen'
];

const Header = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navTabs = [
    { name: 'LIVE CAM', url: 'https://chaturbate.com/in/?tour=g4pe&campaign=cxFud&track=default' },
    { name: 'BET NOW', url: 'https://refpa3267686.top/L?tag=d_4520133m_1599c_&site=4520133&ad=1599' },
    { name: '1XBET', url: 'https://1xbet.com/en/registration/?partner=4520133&promo=1x_3119536' },
    { name: 'HOOKUP', url: 'https://chaturbate.com/in/?tour=OT2s&campaign=cxFud&track=default' }
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-black">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="gradient-overlay rounded-lg p-2">
              <span className="text-xl font-bold text-white">HubX</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link
              to="/"
              className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
            >
              Home
            </Link>

            {/* Categories Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="nav-item flex items-center space-x-1 text-white hover:text-white hover:bg-white/10">
                  <span>All Categories</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-popover/95 backdrop-blur max-h-80 overflow-y-auto">
                <div className="grid grid-cols-1 gap-1 p-2">
                  {categories.map((category) => (
                    <DropdownMenuItem key={category} asChild>
                      <Link
                        to={`/category/${category.toLowerCase().replace(' ', '-')}`}
                        className="text-sm hover:bg-accent/20 rounded px-3 py-2 block"
                      >
                        {category}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Admin Link - Hidden, accessible via direct URL */}
            <Link 
              to="/admin-hubx-2024" 
              className="nav-item opacity-0 pointer-events-none absolute"
              style={{ left: '-9999px' }}
            >
              <Settings className="w-4 h-4" />
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-white hover:bg-white/10"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className="space-y-1">
              <div className="w-5 h-0.5 bg-white"></div>
              <div className="w-5 h-0.5 bg-white"></div>
              <div className="w-5 h-0.5 bg-white"></div>
            </div>
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-gray-800">
          <div className="flex items-center justify-center lg:justify-start py-3 gap-2 lg:gap-4 overflow-x-auto">
            {navTabs.map((tab) => (
              <a
                key={tab.name}
                href={tab.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 bg-gray-800 hover:bg-orange-600 text-white font-bold px-3 py-2 lg:px-6 lg:py-2 rounded-full transition-colors duration-200 text-xs lg:text-sm whitespace-nowrap"
              >
                {tab.name}
              </a>
            ))}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-800 py-4">
            <nav className="space-y-2">
              <Link
                to="/"
                className="block nav-item py-2 text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-400 px-3 py-1">Categories</p>
                <div className="grid grid-cols-2 gap-1">
                  {categories.map((category) => (
                    <Link
                      key={category}
                      to={`/category/${category.toLowerCase().replace(' ', '-')}`}
                      className="text-sm hover:bg-white/10 rounded px-3 py-1 block text-white"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {category}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
