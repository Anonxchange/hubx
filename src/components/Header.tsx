import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Search, Settings, Menu, Play, TrendingUp, ThumbsUp, Flame, Star, Users, User, Tv, X, Upload, Image, Clock } from 'lucide-react';
import { getUserCountry } from '@/services/videosService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const categories = [
  'anal', 'big-ass', 'blowjob', 'creampie', 'milf', 'teen', 'pov', 'hardcore', 'amateur', 'lesbian'
];

interface MobileNavItem {
  name: string;
  icon: any;
  path?: string;
  url?: string;
  badge?: string | null;
}

const mobileNavItems = (country: string): MobileNavItem[] => [
  { name: 'Recommended', icon: ThumbsUp, path: '/recommended', badge: null },
  { name: 'Premium', icon: Star, path: '/premium', badge: 'VIP' },
  { name: 'Featured Videos', icon: Play, path: '/', badge: null },
  { name: 'Trending', icon: TrendingUp, path: '/trending', badge: 'HOT' },
  { name: 'Moments', icon: Clock, path: '/moments', badge: null },
  { name: `Hottest in ${country}`, icon: Flame, path: `/hottest/${country.toLowerCase().replace(/\s+/g, '-')}`, badge: 'HOT' },
  { name: 'Channel', icon: Tv, path: '/channel', badge: null },
  { name: 'Most Liked', icon: ThumbsUp, path: '/?sort=likes', badge: null },
  { name: 'Live Cams', icon: Users, url: 'https://chaturbate.com/in/?tour=g4pe&campaign=cxFud&track=default', badge: null },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFullScreenSearch, setIsFullScreenSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userCountry, setUserCountry] = useState<string>('Global');

  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Get user's country
  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const country = await getUserCountry();
        setUserCountry(country);
      } catch (error) {
        console.error('Error fetching user country:', error);
        setUserCountry('Global');
      }
    };
    fetchCountry();
  }, []);

  const trendingSearches = [
    'latina milf',
    'teen creampie',
    'big ass pov',
    'amateur blowjob',
    'hardcore anal'
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Save to recent searches
      const newRecentSearches = [searchQuery.trim(), ...recentSearches.filter(s => s !== searchQuery.trim())].slice(0, 5);
      setRecentSearches(newRecentSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));

      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setIsFullScreenSearch(false);
      setSearchQuery('');
    }
  };

  const handleSearchClick = (searchTerm: string) => {
    setSearchQuery(searchTerm);
    // Save to recent searches
    const newRecentSearches = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));

    navigate(`/?search=${encodeURIComponent(searchTerm)}`);
    setIsFullScreenSearch(false);
    setSearchQuery('');
  };

  const clearRecentSearch = (searchTerm: string) => {
    const newRecentSearches = recentSearches.filter(s => s !== searchTerm);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const navTabs = [
    { name: 'LIVE CAM', url: 'https://chaturbate.com/in/?tour=g4pe&campaign=cxFud&track=default' },
    { name: 'BET NOW', url: 'https://refpa3267686.top/L?tag=d_4520133m_1599c_&site=4520133&ad=1599' },
    { name: '1XBET', url: 'https://1xbet.com/en/registration/?partner=4520133&promo=1x_3119536' },
    { name: 'HOOKUP', url: 'https://chaturbate.com/in/?tour=OT2s&campaign=cxFud&track=default' }
  ];

  return (
    <>
      {/* Main Header - Redesigned horizontal layout */}
      <header className="sticky top-0 z-50 w-full bg-black">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Left side - Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="gradient-overlay rounded-lg p-2">
                <span className="text-xl font-bold text-white">HubX</span>
              </div>
            </Link>

            {/* Center - Search Bar with Upload Icons (Desktop) */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8 items-center space-x-3">
              <form onSubmit={handleSearch} className="relative w-full">
                <Input
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFullScreenSearch(true)}
                  className="w-full bg-gray-800 border-gray-600 text-white placeholder-gray-400 pr-10"
                />
                <Button 
                  type="submit"
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-0 top-0 h-full text-gray-400 hover:text-white hover:bg-transparent"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              {/* Upload Icons */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-orange-500 hover:text-orange-400 hover:bg-white/10 p-2"
                title="Upload Video"
              >
                <Upload className="h-5 w-5" />
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                className="text-orange-500 hover:text-orange-400 hover:bg-white/10 p-2"
                title="Upload Photo"
              >
                <Image className="h-5 w-5" />
              </Button>
            </div>

            {/* Right side - User actions */}
            <div className="flex items-center space-x-4">
              {/* Mobile search button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="lg:hidden text-white hover:bg-white/10"
                onClick={() => setIsFullScreenSearch(true)}
              >
                <Search className="h-5 w-5" />
              </Button>

                        <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <User className="h-5 w-5" />
                </Button>
              </Link>


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
                      <div className="flex items-center space-x-3">
                        <h2 className="text-lg font-semibold">Menu</h2>
                        <div className="flex items-center space-x-2">
                          {/* Straight Icon */}
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center" title="Straight">
                            <span className="text-white text-xs font-bold">♂♀</span>
                          </div>
                          {/* Lesbian Icon */}
                          <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center" title="Lesbian">
                            <span className="text-white text-xs font-bold">♀♀</span>
                          </div>
                          {/* Gay Icon */}
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center" title="Gay">
                            <span className="text-white text-xs font-bold">♂♂</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="p-4 space-y-2">
                        {mobileNavItems(userCountry).map((item) => (
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
                            ) : item.path ? (
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
                            ) : null}
                          </div>
                        ))}
                      </div>

                      {/* Categories Section */}
                      <div className="px-4 pb-4">
                        <div className="border-t border-border pt-4">
                          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">Categories</h3>
                          <div className="space-y-1">
                            <Link
                              to="/categories"
                              className="flex items-center p-3 rounded-lg hover:bg-muted/50 transition-colors border-b border-border mb-2"
                            >
                              <span className="text-sm font-semibold text-orange-500">All Categories</span>
                            </Link>
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

              {/* Admin Link - Hidden */}
              <Link 
                to="/admin-hubx-2024" 
                className="nav-item opacity-0 pointer-events-none absolute"
                style={{ left: '-9999px' }}
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs Bar - Desktop horizontal menu */}
      <div className="hidden lg:block w-full bg-black border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-12 space-x-8">
            <Link
              to="/"
              className={`text-sm font-medium text-white hover:text-orange-500 transition-colors ${location.pathname === '/' ? 'text-orange-500' : ''}`}
            >
              HOME
            </Link>

            <Link
             to="/recommended"
            className={`text-sm font-medium text-white hover:text-orange-500 transition-colors ${location.pathname === '/recommended' ? 'text-orange-500' : ''}`}
             >
               RECOMMENDED
             </Link>

            <Link
              to="/premium"
              className={`text-sm font-medium text-white hover:text-orange-500 transition-colors flex items-center space-x-1 ${location.pathname === '/premium' ? 'text-orange-500' : ''}`}
            >
              <Star className="w-4 h-4" />
              <span>PREMIUM</span>
            </Link>

            {/* Categories Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-sm font-bold text-white hover:text-orange-500 transition-colors h-auto p-0 flex items-center space-x-1">
                  <span>CATEGORIES</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 bg-black backdrop-blur z-50 border border-gray-800 max-h-96 overflow-y-auto">
                <div className="p-2">
                  <DropdownMenuItem asChild>
                    <Link to="/categories" className="text-sm text-orange-500 hover:bg-gray-800 hover:text-orange-400 rounded px-3 py-2 block font-semibold border-b border-gray-700 mb-2">All Categories</Link>
                  </DropdownMenuItem>
                </div>
                <div className="grid grid-cols-2 gap-1 p-2"></div>
                  <DropdownMenuItem asChild>
                    <Link to="/category/18-25" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">18-25</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/60fps" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">60FPS</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/amateur" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Amateur</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/anal" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Anal</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/arab" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Arab</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/asian" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Asian</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/babe" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Babe</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/babysitter" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Babysitter (18+)</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/bbw" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">BBW</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/behind-the-scenes" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Behind The Scenes</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/big-ass" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Big Ass</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/big-dick" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Big Dick</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/big-tits" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Big Tits</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/blonde" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Blonde</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/blowjob" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Blowjob</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/bondage" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Bondage</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/brazilian" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Brazilian</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/british" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">British</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/brunette" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Brunette</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/cartoon" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Cartoon</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/casting" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Casting</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/college" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">College (18+)</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/compilation" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Compilation</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/cosplay" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Cosplay</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/creampie" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Creampie</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/cumshot" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Cumshot</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/czech" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Czech</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/double-penetration" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Double Penetration</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/ebony" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Ebony</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/euro" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Euro</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/exclusive" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Exclusive</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/feet" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Feet</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/female-orgasm" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Female Orgasm</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/fetish" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Fetish</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/fingering" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Fingering</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/fisting" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Fisting</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/french" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">French</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/funny" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Funny</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/gaming" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Gaming</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/gangbang" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Gangbang</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/german" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">German</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/handjob" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Handjob</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/hardcore" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Hardcore</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/hd" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">HD Porn</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/hentai" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Hentai</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/indian" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Indian</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/interactive" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Interactive</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/interracial" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Interracial</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/italian" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Italian</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/japanese" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Japanese</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/korean" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Korean</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/latina" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Latina</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/lesbian" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Lesbian</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/massage" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Massage</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/masturbation" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Masturbation</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/mature" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Mature</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/milf" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">MILF</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/music" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Music</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/muscular-men" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Muscular Men</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/old-young" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Old/Young (18+)</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/orgy" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Orgy</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/parody" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Parody</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/party" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Party</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/pissing" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Pissing</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/podcast" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Podcast</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/popular-with-women" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Popular With Women</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/pornstar" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Pornstar</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/pov" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">POV</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/public" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Public</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/pussy-licking" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Pussy Licking</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/reality" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Reality</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/redhead" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Red Head</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/role-play" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Role Play</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/romantic" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Romantic</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/rough-sex" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Rough Sex</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/russian" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Russian</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/school" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">School (18+)</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/sfw" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">SFW</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/small-tits" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Small Tits</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/smoking" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Smoking</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/solo-female" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Solo Female</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/solo-male" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Solo Male</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/squirt" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Squirt</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/step-fantasy" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Step Fantasy</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/strap-on" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Strap On</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/striptease" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Striptease</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/tattooed-women" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Tattooed Women</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/threesome" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Threesome</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/toys" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Toys</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/transgender" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Transgender</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/verified-amateurs" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Verified Amateurs</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/verified-couples" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Verified Couples</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/verified-models" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Verified Models</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/vintage" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Vintage</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/virtual-reality" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Virtual Reality</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/category/webcam" className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block">Webcam</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            <a
              href="https://chaturbate.com/in/?tour=g4pe&campaign=cxFud&track=default"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-white hover:text-orange-500 transition-colors"
            >
              LIVE CAMS
            </a>

            <Link
              to="/trending"
              className={`text-sm font-medium text-white hover:text-orange-500 transition-colors ${location.pathname === '/trending' ? 'text-orange-500' : ''}`}
            >
              TRENDING
            </Link>

            <Link
              to={`/hottest/${userCountry.toLowerCase().replace(/\s+/g, '-')}`}
              className={`text-sm font-medium text-white hover:text-orange-500 transition-colors flex items-center space-x-1 ${location.pathname.includes('/hottest') ? 'text-orange-500' : ''}`}
            >
              <Flame className="w-4 h-4" />
              <span>HOTTEST IN {userCountry.toUpperCase()}</span>
            </Link>

            <Link
              to="/premium"
              className="text-sm font-medium text-white hover:text-orange-500 transition-colors"
            >
              PORNSTARS
            </Link>

            <Link
              to="/?sort=trending"
              className="text-sm font-medium text-white hover:text-orange-500 transition-colors"
            >
              FUCK NOW
            </Link>

            <Link
              to="/channel"
              className={`text-sm font-medium text-white hover:text-orange-500 transition-colors ${location.pathname === '/channel' ? 'text-orange-500' : ''}`}
            >
              COMMUNITY
            </Link>

            <Link
              to="/?type=photos"
              className="text-sm font-medium text-white hover:text-orange-500 transition-colors"
            >
              PHOTOS & GIFS
            </Link>

            <Link to="/moments" className="text-sm font-bold text-white hover:text-orange-500 transition-colors flex items-center gap-1">
              MOMENTS
              <Badge variant="secondary" className="text-xs px-1 py-0 bg-orange-600 text-white">BETA</Badge>
            </Link>

            {/* Social Media Icons */}
            <div className="flex items-center space-x-2">
              <a 
                href="https://twitter.com/your-twitter-handle" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-orange-500 transition-colors p-2 hover:bg-white/10 rounded-lg"
                title="Follow us on X (Twitter)"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              <a 
                href="https://discord.gg/your-discord-link" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-orange-500 transition-colors p-2 hover:bg-white/10 rounded-lg"
                title="Join our Discord"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.10 0 0a 10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.191.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Search Overlay */}
      {isFullScreenSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-[100] flex flex-col">
          {/* Search Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center flex-1 space-x-4">
              <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search videos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-900 border-gray-700 text-white placeholder-gray-400 pl-12 pr-4 py-3 rounded-full text-lg"
                    autoFocus
                  />
                </div>
              </form>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => setIsFullScreenSearch(false)}
              className="text-white hover:bg-gray-800 ml-4"
            >
              Cancel
            </Button>
          </div>

          {/* Search Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-2xl mx-auto space-y-6">

              {/* Search Suggestions based on current input */}
              {searchQuery.trim() && (
                <div>
                  <h3 className="text-white text-lg font-semibold mb-4">Suggestions</h3>
                  <div className="space-y-2">
                    {categories
                      .filter(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))
                      .slice(0, 5)
                      .map((suggestion, index) => (
                        <div 
                          key={index}
                          className="flex items-center space-x-3 bg-gray-900 hover:bg-gray-800 rounded-lg p-3 cursor-pointer transition-colors"
                          onClick={() => handleSearchClick(suggestion)}
                        >
                          <Search className="w-4 h-4 text-gray-400" />
                          <span className="text-white capitalize">{suggestion}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white text-lg font-semibold">Recent Searches</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearAllRecentSearches}
                      className="text-gray-400 hover:text-white"
                    >
                      Clear all
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {recentSearches.map((search, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between group bg-gray-900 hover:bg-gray-800 rounded-lg p-3 cursor-pointer"
                        onClick={() => handleSearchClick(search)}
                      >
                        <div className="flex items-center space-x-3">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-white">{search}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearRecentSearch(search);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white p-1"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Searches */}
              <div>
                <h3 className="text-white text-lg font-semibold mb-4">Trending Searches</h3>
                <div className="space-y-2">
                  {trendingSearches.map((search, index) => (
                    <div 
                      key={index}
                      className="flex items-center space-x-3 bg-gray-900 hover:bg-gray-800 rounded-lg p-3 cursor-pointer transition-colors"
                      onClick={() => handleSearchClick(search)}
                    >
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                      <span className="text-white">{search}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal for Mobile (Legacy - keeping for compatibility) */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search Videos</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" className="flex-1">
                Search
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsSearchOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bottom Promotional Tabs - Mobile friendly */}
      <div className="lg:hidden w-full bg-black border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-3 gap-2 overflow-x-auto">
            {navTabs.map((tab) => (
              <a
                key={tab.name}
                href={tab.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 bg-gray-800 hover:bg-orange-600 text-white font-bold px-3 py-2 rounded-full transition-colors duration-200 text-xs whitespace-nowrap"
              >
                {tab.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;