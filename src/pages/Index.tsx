
import React from 'react';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import Header from '@/components/Header';
import VideoGrid from '@/components/VideoGrid';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 lg:py-20">
        <div className="absolute inset-0 gradient-overlay opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center space-y-4">
            <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Welcome to HubX
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover and stream the latest content with our modern video platform
            </p>
            
            {/* Admin Panel Link */}
            <div className="pt-4">
              <Link 
                to="/admin" 
                className="inline-flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Admin Panel</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-12 space-y-12">
        <VideoGrid title="Recently Uploaded" />
        
        <VideoGrid title="Trending Now" />
        
        <VideoGrid title="Recommended for You" />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="gradient-overlay rounded-lg p-2">
              <span className="text-lg font-bold text-white">HubX</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 HubX. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
