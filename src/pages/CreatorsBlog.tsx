import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Clock, Tag, TrendingUp, Star, Heart } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const CreatorsBlog = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Posts' },
    { id: 'tips', label: 'Creator Tips' },
    { id: 'earnings', label: 'Earnings Guide' },
    { id: 'tech', label: 'Technology' },
    { id: 'community', label: 'Community' },
    { id: 'updates', label: 'Platform Updates' }
  ];

  const blogPosts = [
    {
      id: 1,
      title: 'Maximizing Your Earnings: Top 10 Tips for New Creators',
      excerpt: 'Learn proven strategies to increase your income and build a loyal fanbase on HubX.',
      category: 'earnings',
      author: 'HubX Team',
      date: '2024-01-15',
      readTime: '8 min read',
      featured: true,
      image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=400&fit=crop'
    },
    {
      id: 2,
      title: 'VR Content Creation: The Future is Here',
      excerpt: 'Discover how virtual reality is revolutionizing adult content and how you can get started.',
      category: 'tech',
      author: 'Sarah Chen',
      date: '2024-01-12',
      readTime: '6 min read',
      featured: true,
      image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&h=400&fit=crop'
    },
    {
      id: 3,
      title: 'Building Your Personal Brand as a Content Creator',
      excerpt: 'Essential strategies for establishing your unique identity and growing your audience.',
      category: 'tips',
      author: 'Marcus Rodriguez',
      date: '2024-01-10',
      readTime: '10 min read',
      featured: false,
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop'
    },
    {
      id: 4,
      title: 'New Analytics Dashboard: Track Your Success',
      excerpt: 'We\'ve launched an enhanced analytics dashboard with more insights than ever before.',
      category: 'updates',
      author: 'HubX Team',
      date: '2024-01-08',
      readTime: '4 min read',
      featured: false,
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop'
    },
    {
      id: 5,
      title: 'Content Safety & Community Guidelines Update',
      excerpt: 'Important updates to our community guidelines and new safety features for creators.',
      category: 'community',
      author: 'Safety Team',
      date: '2024-01-05',
      readTime: '7 min read',
      featured: false,
      image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop'
    },
    {
      id: 6,
      title: 'Mobile Optimization: Create Content Anywhere',
      excerpt: 'Tips for creating high-quality content using just your smartphone and basic equipment.',
      category: 'tips',
      author: 'Alex Thompson',
      date: '2024-01-03',
      readTime: '5 min read',
      featured: false,
      image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=400&fit=crop'
    }
  ];

  const filteredPosts = selectedCategory === 'all' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const featuredPosts = blogPosts.filter(post => post.featured);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">Creator's Blog</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Tips, insights, and updates to help you succeed as a content creator on HubX
          </p>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <h2 className="text-2xl font-bold">Featured Posts</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-yellow-500 text-black font-bold">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                      <Badge variant="outline" className="text-xs">
                        {categories.find(cat => cat.id === post.category)?.label}
                      </Badge>
                      <span>•</span>
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(post.date).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {post.readTime}
                      </span>
                    </div>
                    <CardTitle className="group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>{post.author}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-600">
                        Read More →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={selectedCategory === category.id ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* All Posts */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">
            {selectedCategory === 'all' ? 'All Posts' : categories.find(cat => cat.id === selectedCategory)?.label}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="flex">
                  <div className="relative w-1/3 h-32 overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
                      <Badge variant="outline" className="text-xs">
                        {categories.find(cat => cat.id === post.category)?.label}
                      </Badge>
                      <span>•</span>
                      <span>{new Date(post.date).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-sm mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA for Creators */}
        <Card className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/20">
          <CardContent className="p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold">Ready to Start Creating?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of successful creators earning money on HubX. Our blog is here to support you every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/become-model">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Heart className="w-4 h-4 mr-2" />
                  Become a Creator
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline">
                  Contact Support
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default CreatorsBlog;