
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="gradient-overlay rounded-lg p-2">
              <span className="text-xl font-bold text-white">HubX</span>
            </div>
          </Link>

          {/* Navigation Tabs */}
          <div className="hidden lg:flex items-center flex-1 justify-center max-w-4xl mx-auto">
            <div className="flex items-center space-x-1 bg-secondary/50 rounded-full p-1">
              <a
                href="https://chaturbate.com/in/?tour=g4pe&campaign=cxFud&track=default"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-sm hover:from-red-500 hover:to-red-400 transition-all duration-200"
              >
                LIVE CAM
              </a>
              <a
                href="https://refpa3267686.top/L?tag=d_4520133m_1599c_&site=4520133&ad=1599"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-bold text-sm hover:from-yellow-500 hover:to-yellow-400 transition-all duration-200"
              >
                BET NOW
              </a>
              <a
                href="https://1xbet.com/en/registration/?partner=4520133&promo=1x_3119536"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-sm hover:from-blue-500 hover:to-blue-400 transition-all duration-200"
              >
                1XBET
              </a>
              <a
                href="https://chaturbate.com/in/?tour=OT2s&campaign=cxFud&track=default"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-600 to-pink-500 text-white font-bold text-sm hover:from-pink-500 hover:to-pink-400 transition-all duration-200"
              >
                HOOKUP
              </a>
            </div>
          </div>

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
                <Button variant="ghost" className="nav-item flex items-center space-x-1">
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
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className="space-y-1">
              <div className="w-5 h-0.5 bg-foreground"></div>
              <div className="w-5 h-0.5 bg-foreground"></div>
              <div className="w-5 h-0.5 bg-foreground"></div>
            </div>
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border/40 py-4">
            <nav className="space-y-2">
              <Link
                to="/"
                className="block nav-item py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              
              {/* Mobile Navigation Tabs */}
              <div className="space-y-2 py-2">
                <p className="text-sm font-medium text-muted-foreground px-3 py-1">External Links</p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="https://chaturbate.com/in/?tour=g4pe&campaign=cxFud&track=default"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-red-600 text-white text-xs font-bold rounded text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    LIVE CAM
                  </a>
                  <a
                    href="https://refpa3267686.top/L?tag=d_4520133m_1599c_&site=4520133&ad=1599"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-yellow-600 text-white text-xs font-bold rounded text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    BET NOW
                  </a>
                  <a
                    href="https://1xbet.com/en/registration/?partner=4520133&promo=1x_3119536"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    1XBET
                  </a>
                  <a
                    href="https://chaturbate.com/in/?tour=OT2s&campaign=cxFud&track=default"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-pink-600 text-white text-xs font-bold rounded text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    HOOKUP
                  </a>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground px-3 py-1">Categories</p>
                <div className="grid grid-cols-2 gap-1">
                  {categories.map((category) => (
                    <Link
                      key={category}
                      to={`/category/${category.toLowerCase().replace(' ', '-')}`}
                      className="text-sm hover:bg-accent/20 rounded px-3 py-1 block"
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
