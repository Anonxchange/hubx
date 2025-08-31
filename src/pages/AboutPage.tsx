import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Heart, Star, Shield, Zap, Globe } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const AboutPage = () => {
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
          <h1 className="text-4xl md:text-5xl font-bold">About HubX</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The world's leading adult content platform, empowering creators and connecting them with their audience
          </p>
        </div>

        {/* Mission Section */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-2xl">
              <Heart className="w-6 h-6 text-red-500" />
              <span>Our Mission</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">
              HubX was founded with a simple mission: to create a safe, inclusive, and empowering platform where adult content creators can thrive while connecting with their audiences in meaningful ways.
            </p>
            <p className="text-muted-foreground">
              We believe in providing creators with the tools, technology, and support they need to build sustainable careers while maintaining complete control over their content and earning potential.
            </p>
          </CardContent>
        </Card>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-50/5 to-blue-100/5">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-400">
                <Shield className="w-5 h-5" />
                <span>Safety First</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We prioritize the safety and security of our creators and users with industry-leading moderation, verification, and privacy protections.
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-50/5 to-purple-100/5">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-400">
                <Users className="w-5 h-5" />
                <span>Creator-Centric</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Everything we do is designed to empower creators with the highest revenue shares, best tools, and most supportive community in the industry.
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-gradient-to-br from-green-50/5 to-green-100/5">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-400">
                <Zap className="w-5 h-5" />
                <span>Innovation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We continuously push the boundaries of technology with features like VR content, advanced analytics, and seamless payment processing.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span>HubX by the Numbers</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-400">50M+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-purple-400">100K+</div>
                <div className="text-sm text-muted-foreground">Verified Creators</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-400">$500M+</div>
                <div className="text-sm text-muted-foreground">Paid to Creators</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-orange-400">150+</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <span>Company Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold">Founded</h3>
                <p className="text-muted-foreground">2020 in San Francisco, CA</p>
                
                <h3 className="font-semibold">Team Size</h3>
                <p className="text-muted-foreground">500+ employees worldwide</p>
                
                <h3 className="font-semibold">Headquarters</h3>
                <p className="text-muted-foreground">San Francisco, California, USA</p>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold">Available In</h3>
                <p className="text-muted-foreground">150+ countries and territories</p>
                
                <h3 className="font-semibold">Content Types</h3>
                <p className="text-muted-foreground">Videos, Photos, Live Streams, VR Content</p>
                
                <h3 className="font-semibold">Revenue Share</h3>
                <p className="text-muted-foreground">Up to 70% for creators</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Ready to Join HubX?</h2>
          <p className="text-muted-foreground">
            Whether you're a creator or viewer, we're here to provide the best adult content experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/become-model">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                Become a Creator
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline">
                Sign Up to Watch
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
