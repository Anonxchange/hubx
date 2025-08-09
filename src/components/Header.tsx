
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Search, Settings, Menu, Play, TrendingUp, ThumbsUp, Flame, Star, Users, User, Tv, X, Upload, Image, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const mobileNavItems: MobileNavItem[] = [
  { name: 'Recommended', icon: ThumbsUp, path: '/recommended', badge: null },
  { name: 'Premium', icon: Star, path: '/premium', badge: 'VIP' },
  { name: 'Featured Videos', icon: Play, path: '/', badge: null },
  { name: 'Trending', icon: TrendingUp, path: '/?sort=trending', badge: 'HOT' },
  { name: 'Moment', icon: Clock, path: '/moment', badge: null },
  { name: 'Hottest', icon: Flame, path: '/hottest', badge: 'HOT' },
  { name: 'Channel', icon: Tv, path: '/channel', badge: null },
  { name: 'Most Liked', icon: ThumbsUp, path: '/?sort=likes', badge: null },
  { name: 'Live Cams', icon: Users, url: 'https://chaturbate.com/in/?tour=g4pe&campaign=cxFud&track=default', badge: null },
];

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFullScreenSearch, setIsFullScreenSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
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
              <div className="relative w-full">
                <Input
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFullScreenSearch(true)}
                  className="w-full bg-gray-800 border-gray-600 text-white placeholder-gray-400 pr-10"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-0 top-0 h-full text-gray-400 hover:text-white hover:bg-transparent"
                  onClick={() => setIsFullScreenSearch(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
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
                      <h2 className="text-lg font-semibold">Menu</h2>
                    </div>
                    
                    {/* Navigation Items */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="p-4 space-y-2">
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
                <Button variant="ghost" className="text-sm font-medium text-white hover:text-orange-500 transition-colors h-auto p-0 flex items-center space-x-1">
                  <span>CATEGORIES</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-black backdrop-blur z-50 border border-gray-800">
                <div className="grid grid-cols-1 gap-1 p-2">
                  {categories.map((category) => (
                    <DropdownMenuItem key={category} asChild>
                      <Link
                        to={`/category/${category.toLowerCase()}`}
                        className="text-sm text-white hover:bg-gray-800 hover:text-orange-500 rounded px-3 py-2 block capitalize"
                      >
                        {category}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
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
