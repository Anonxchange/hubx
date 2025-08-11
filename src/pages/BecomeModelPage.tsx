
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, DollarSign, Star, Camera, Users, TrendingUp } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const BecomeModelPage = () => {
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
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Clock className="w-8 h-8 text-blue-400 stroke-[3]" />
            <h1 className="text-3xl md:text-4xl font-bold">Become a Model</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Start your journey as a content creator and earn money with HubX. Join thousands of successful models worldwide.
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <DollarSign className="w-4 h-4 mr-1" />
            Earn up to 70% revenue share
          </Badge>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-50/5 to-blue-100/5">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-400">
                <DollarSign className="w-5 h-5" />
                <span>High Earnings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Earn up to 70% of your content revenue. Weekly payments with multiple payout options available.
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-500/20 bg-gradient-to-br from-orange-50/5 to-orange-100/5">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-400">
                <Users className="w-5 h-5" />
                <span>Global Audience</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Reach millions of viewers worldwide. Build your fanbase and grow your personal brand.
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-gradient-to-br from-green-50/5 to-green-100/5">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-400">
                <TrendingUp className="w-5 h-5" />
                <span>Analytics & Growth</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced analytics tools to track your performance and optimize your content strategy.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Requirements */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span>Model Requirements</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Basic Requirements:</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Must be 18+ years old</li>
                  <li>• Valid government-issued ID</li>
                  <li>• High-quality webcam or camera</li>
                  <li>• Reliable internet connection</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Preferred Qualifications:</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Content creation experience</li>
                  <li>• Social media presence</li>
                  <li>• Professional appearance</li>
                  <li>• Consistent schedule availability</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-purple-400" />
              <span>How to Get Started</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white font-bold">1</span>
                </div>
                <h3 className="font-semibold">Apply</h3>
                <p className="text-sm text-muted-foreground">Submit your application with required documents</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="font-semibold">Verification</h3>
                <p className="text-sm text-muted-foreground">Complete age and identity verification process</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="font-semibold">Start Earning</h3>
                <p className="text-sm text-muted-foreground">Upload content and start earning immediately</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
            <Clock className="w-5 h-5 mr-2" />
            Apply to Become a Model
          </Button>
          <p className="text-sm text-muted-foreground">
            Questions? <Link to="/contact" className="text-blue-400 hover:underline">Contact our support team</Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BecomeModelPage;
