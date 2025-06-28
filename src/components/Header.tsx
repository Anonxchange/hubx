
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Home, Camera, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navigationItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Live Cams', href: '/live-cams', icon: Camera },
  { label: 'Bet Now', href: '/bet-now' },
  { label: '1Win', href: '/1win' },
  { label: 'Porn Girls', href: '/porn-girls' },
  { label: 'Featured Videos', href: '/featured', icon: Video },
  { label: 'Recommended', href: '/recommended' },
  { label: 'Shorties', href: '/shorties' },
  { label: 'Hottest in Nigeria', href: '/hottest-nigeria' },
];

const categories = [
  'MILF', 'Teen', 'Ebony', 'Asian', 'Blonde', 'Brunette', 'BBW', 'Anal', 
  'Blowjob', 'Creampie', 'Facial', 'Interracial', 'Lesbian', 'POV'
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

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.slice(0, 8).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`nav-item ${location.pathname === item.href ? 'active' : ''}`}
                >
                  {Icon && <Icon className="mr-1 h-4 w-4" />}
                  {item.label}
                </Link>
              );
            })}

            {/* Categories Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="nav-item">
                  All Categories
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-popover/95 backdrop-blur">
                <div className="grid grid-cols-2 gap-1 p-2">
                  {categories.map((category) => (
                    <DropdownMenuItem key={category} asChild>
                      <Link
                        to={`/category/${category.toLowerCase()}`}
                        className="text-sm hover:bg-accent/20 rounded px-2 py-1"
                      >
                        {category}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/channels" className="nav-item">Channels</Link>
            <Link to="/playlists" className="nav-item">Playlists</Link>
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
            <nav className="grid grid-cols-2 gap-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="nav-item text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
