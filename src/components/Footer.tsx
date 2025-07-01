
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const categories = [
  'Big Ass', 'Big Tits', 'Ebony', 'MILF', 'Lesbian', 'Teen'
];

const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Left side - Navigation links */}
          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link
              to="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              to="/contact"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </Link>
            
            {/* Categories Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto font-normal">
                  <span>Categories</span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-popover/95 backdrop-blur">
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
          </div>

          {/* Right side - Copyright */}
          <div className="text-sm text-muted-foreground">
            © 2024 HubX. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
