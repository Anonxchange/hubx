
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Search, Settings, Menu, Play, TrendingUp, ThumbsUp, Flame, Star, Users, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

const categories = [
  'anal', 'big-ass', 'blowjob', 'creampie', 'milf', 'teen', 'pov', 'hardcore', 'amateur', 'lesbian'
];

const mobileNavItems = [
  { name: 'Featured Videos', icon: Play, path: '/', badge: null },
  { name: 'Premium', icon: Star, path: '/premium', badge: 'VIP' },
  { name: 'Trending', icon: TrendingUp, path: '/?sort=trending', badge: 'HOT' },
  { name: 'Most Liked', icon: ThumbsUp, path: '/?sort=likes', badge: null },
  { name: 'Live Cams', icon: Users, url: 'https://chaturbate.com/in/?tour=g4pe&campaign=cxFud&track=default', badge: null },
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

            <Link
              to="/premium"
              className={`nav-item flex items-center space-x-1 ${location.pathname === '/premium' ? 'active' : ''}`}
            >
              <Star className="w-4 h-4" />
              <span>Premium</span>
            </Link>

            {/* Categories Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="nav-item flex items-center space-x-1 text-white hover:text-white hover:bg-white/10">
                  <span>All Categories</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-popover backdrop-blur z-50 border border-border">
                <div className="grid grid-cols-1 gap-1 p-2">
                  {categories.map((category) => (
                    <DropdownMenuItem key={category} asChild>
                      <Link
                        to={`/category/${category.toLowerCase()}`}
                        className="text-sm hover:bg-accent/20 rounded px-3 py-2 block"
                      >
                        {category === 'recommended' ? 'Recommended' : category}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Login Button */}
            <Button variant="ghost" className="nav-item flex items-center space-x-1 text-white hover:text-white hover:bg-white/10">
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Button>

            {/* Admin Link - Hidden, accessible via direct URL */}
            <Link 
              to="/admin-hubx-2024" 
              className="nav-item opacity-0 pointer-events-none absolute"
              style={{ left: '-9999px' }}
            >
              <Settings className="w-4 h-4" />
            </Link>
          </nav>

          {/* Desktop Login Button for smaller screens */}
          <div className="hidden md:flex lg:hidden">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <LogIn className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-white hover:bg-white/10"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-background border-l border-border p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <h2 className="text-lg font-semibold">Menu</h2>
                </div>
                
                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 space-y-2">
                    {/* Login Item for Mobile */}
                    <div className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors group border-b border-border mb-4">
                      <div className="flex items-center space-x-3">
                        <LogIn className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                        <span className="font-medium">Login</span>
                      </div>
                    </div>

                    {mobileNavItems.map((item) => (
                      <div key={item.name}>
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex items-center space-x-3">
                              <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                              <span className="font-medium">{item.name}</span>
                            </div>
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </a>
                        ) : (
                          <Link
                            to={item.path}
                            className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex items-center space-x-3">
                              <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                              <span className="font-medium">{item.name}</span>
                            </div>
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Categories Section */}
                  <div className="px-4 pb-4">
                    <div className="border-t border-border pt-4">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">Categories</h3>
                      <div className="space-y-1">
                        {categories.map((category) => (
                          <Link
                            key={category}
                            to={`/category/${category.toLowerCase()}`}
                            className="flex items-center p-3 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <span className="text-sm capitalize">{category}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
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

      </div>
    </header>
  );
};

export default Header;
