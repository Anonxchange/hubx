
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, Filter } from 'lucide-react';
import Header from '@/components/Header';
import VideoGrid from '@/components/VideoGrid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useVideos } from '@/hooks/useVideos';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useVideos(currentPage, 20, selectedCategory);

  const videos = data?.videos || [];
  const totalPages = data?.totalPages || 1;
  const totalVideos = data?.totalCount || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section with 18+ Notice */}
      <section className="relative overflow-hidden py-8 lg:py-12">
        <div className="absolute inset-0 gradient-overlay opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center space-y-4">
            <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Welcome to HubX
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover premium adult content in stunning HD quality. New videos added daily.
            </p>
            
            {/* 18+ Age Verification Notice */}
            <div className="max-w-md mx-auto mt-6">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-destructive">
                  <div className="w-6 h-6 rounded-full bg-destructive flex items-center justify-center text-white text-sm font-bold">
                    18
                  </div>
                  <span className="font-semibold">18+ Only</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  You must be 18 years or older to access this content
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50"
            />
          </div>
          
          {/* Filters */}
          <div className="flex items-center space-x-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="ebony">Ebony</SelectItem>
                <SelectItem value="big-ass">Big Ass</SelectItem>
                <SelectItem value="cumshot">Cumshot</SelectItem>
                <SelectItem value="anal">Anal</SelectItem>
                <SelectItem value="lesbian">Lesbian</SelectItem>
                <SelectItem value="milf">MILF</SelectItem>
                <SelectItem value="japanese">Japanese</SelectItem>
                <SelectItem value="hentai">Hentai</SelectItem>
                <SelectItem value="amateur">Amateur</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSort} onValueChange={setSelectedSort}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Newest" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mt-4 mb-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>Showing {totalVideos} videos</span>
          </div>
        </div>
      </section>

      {/* Main Video Grid */}
      <main className="container mx-auto px-4 pb-12">
        <VideoGrid 
          title="" 
          showTitle={false} 
          videos={videos}
          isLoading={isLoading}
        />
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(pageNum);
                        }}
                        isActive={currentPage === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {totalPages > 5 && (
                  <PaginationItem>
                    <span className="px-4 py-2">...</span>
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </main>

      {/* Footer - Styled like the uploaded image */}
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="gradient-overlay rounded-lg p-2">
                  <span className="text-xl font-bold text-white">HubX</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Premium adult entertainment platform with the latest HD content. 
                New videos added daily for your viewing pleasure.
              </p>
            </div>

            {/* Categories */}
            <div>
              <h3 className="font-semibold mb-4 text-lg">Categories</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/category/ebony" className="text-gray-400 hover:text-white transition-colors">Ebony</Link></li>
                <li><Link to="/category/big-ass" className="text-gray-400 hover:text-white transition-colors">Big Ass</Link></li>
                <li><Link to="/category/anal" className="text-gray-400 hover:text-white transition-colors">Anal</Link></li>
                <li><Link to="/category/lesbian" className="text-gray-400 hover:text-white transition-colors">Lesbian</Link></li>
                <li><Link to="/category/milf" className="text-gray-400 hover:text-white transition-colors">MILF</Link></li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4 text-lg">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/category/amateur" className="text-gray-400 hover:text-white transition-colors">Amateur</Link></li>
                <li><Link to="/category/hentai" className="text-gray-400 hover:text-white transition-colors">Hentai</Link></li>
                <li><Link to="/category/japanese" className="text-gray-400 hover:text-white transition-colors">Japanese</Link></li>
              </ul>
            </div>

            {/* Legal & Info */}
            <div>
              <h3 className="font-semibold mb-4 text-lg">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="text-gray-400">Privacy Policy</span></li>
                <li><span className="text-gray-400">Terms of Service</span></li>
                <li><span className="text-gray-400">DMCA</span></li>
                <li><span className="text-gray-400">2257 Compliance</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 HubX. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <span className="text-gray-400 text-sm">18+ Adult Content</span>
              <span className="text-gray-400 text-sm">•</span>
              <span className="text-gray-400 text-sm">Parental Controls</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
