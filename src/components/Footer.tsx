
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Play, Users, Video } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const categories = [
  'Big Ass', 'Big Tits', 'Ebony', 'MILF', 'Lesbian', 'Teen'
];

const Footer = () => {
  return (
    <footer className="bg-card/50 backdrop-blur-sm border-t border-border/50 mt-8">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-2">
              <Play className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold">HubX</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Premium video streaming platform with the best content from creators worldwide.
            </p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Video className="w-4 h-4" />
                <span>HD Quality</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>Safe Platform</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <div className="flex flex-col space-y-2">
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Home
              </Link>
              <Link
                to="/terms"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/privacy"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/contact"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Categories</h4>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <Link
                  key={category}
                  to={`/category/${category.toLowerCase().replace(' ', '-')}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>

          {/* About */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">About HubX</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              HubX is your ultimate playground for unfiltered pleasure ,where raw passion meets cinematic seduction. From real amateur encounters to polished studio masterpieces, every scene is hand-picked for your desire. Unlock HubX Premium for exclusive, high-definition experiences you won’t see anywhere else. Updated daily, tailored for your cravings, and always ready to satisfy.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                4K Support
              </span>
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                Mobile Ready
              </span>
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                Fast Streaming
              </span>
            </div>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* RTA Compliance Section */}
        <div className="flex flex-col items-center space-y-4 mb-6">
          <div className="flex items-center justify-center">
            <img 
              src="https://www.rtalabel.org/images/rta_label.gif" 
              alt="RTA-5042-1996-1400-1577-RTA" 
              className="h-12 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden bg-primary/10 border border-primary/20 px-4 py-2 rounded">
              <span className="text-primary font-semibold text-sm">RTA</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-2xl leading-relaxed">
            This website is rated with RTA label. Parents, you can easily block access to this site. 
            Please read this <a href="https://www.rtalabel.org/index.php?content=parents" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">page</a> for more information.
          </p>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="text-sm text-muted-foreground">
            © 2025 HubX. All rights reserved.
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Powered by pleasure, perfected by technology.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
