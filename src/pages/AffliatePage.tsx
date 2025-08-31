import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, DollarSign, TrendingUp, Share2, Target, BarChart3, Gift, Star, CheckCircle, Copy } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AffiliatePage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [referralCode] = useState('HUBX-AF-2024');

  const commissionRates = [
    {
      tier: "Bronze",
      referrals: "1-50",
      rate: "25%",
      color: "amber"
    },
    {
      tier: "Silver", 
      referrals: "51-200",
      rate: "35%",
      color: "gray"
    },
    {
      tier: "Gold",
      referrals: "201-500",
      rate: "45%",
      color: "yellow"
    },
    {
      tier: "Diamond",
      referrals: "500+",
      rate: "55%",
      color: "blue"
    }
  ];

  const earningMethods = [
    {
      icon: Users,
      title: "User Referrals",
      description: "Earn 25-55% commission on subscriptions from users you refer",
      example: "$5-11 per premium subscription"
    },
    {
      icon: Share2,
      title: "Creator Referrals", 
      description: "Earn 10% commission on creator earnings for 12 months",
      example: "$50-500+ per active creator"
    },
    {
      icon: Target,
      title: "Premium Upgrades",
      description: "Higher commissions for premium plan conversions",
      example: "$15-25 per premium upgrade"
    },
    {
      icon: Gift,
      title: "Bonus Campaigns",
      description: "Special bonus campaigns during promotional periods",
      example: "$100-1000+ bonus rewards"
    }
  ];

  const marketingTools = [
    {
      name: "Banner Ads",
      description: "High-converting banner advertisements in multiple sizes",
      formats: "728x90, 300x250, 160x600"
    },
    {
      name: "Landing Pages",
      description: "Optimized landing pages designed for maximum conversion",
      formats: "Mobile & Desktop optimized"
    },
    {
      name: "Email Templates",
      description: "Professional email templates for your marketing campaigns",
      formats: "HTML & Text versions"
    },
    {
      name: "Social Media Kit",
      description: "Social media posts, stories, and promotional content",
      formats: "Instagram, Twitter, TikTok"
    }
  ];

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
  };

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
            <Share2 className="w-12 h-12 text-green-600" />
            <h1 className="text-4xl md:text-5xl font-bold">Affiliate Program</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Earn money by promoting HubX and referring new users and creators to our platform
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2 bg-green-600 text-white">
            <DollarSign className="w-4 h-4 mr-1" />
            Up to 55% Commission
          </Badge>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600 mb-2">55%</div>
              <div className="text-sm font-medium">Max Commission</div>
              <div className="text-xs text-muted-foreground">Diamond tier</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600 mb-2">30 days</div>
              <div className="text-sm font-medium">Cookie Duration</div>
              <div className="text-xs text-muted-foreground">Attribution window</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600 mb-2">$50</div>
              <div className="text-sm font-medium">Minimum Payout</div>
              <div className="text-xs text-muted-foreground">Weekly payments</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-sm font-medium">Real-time Tracking</div>
              <div className="text-xs text-muted-foreground">Live dashboard</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="tools">Marketing Tools</TabsTrigger>
            <TabsTrigger value="join">Join Now</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span>How to Earn with HubX Affiliate Program</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {earningMethods.map((method, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <method.icon className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">{method.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                        <Badge variant="outline" className="text-xs text-green-600">
                          {method.example}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-600/10 to-blue-600/10 border-green-500/20">
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <h2 className="text-2xl font-bold">Success Story</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    "I've been promoting HubX for 8 months and consistently earn $3,000+ monthly. 
                    The high conversion rates and generous commissions make it my top affiliate program."
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>Top Affiliate Partner</span>
                    </div>
                    <span>•</span>
                    <span>Diamond Tier</span>
                    <span>•</span>
                    <span>$25K+ Total Earnings</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <span>Commission Tiers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {commissionRates.map((tier, index) => (
                    <Card key={index} className={`border-2 ${
                      tier.color === 'amber' ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20' :
                      tier.color === 'gray' ? 'border-gray-500/50 bg-gray-50/50 dark:bg-gray-950/20' :
                      tier.color === 'yellow' ? 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20' :
                      'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20'
                    }`}>
                      <CardContent className="p-6 text-center">
                        <div className={`text-3xl font-bold mb-2 ${
                          tier.color === 'amber' ? 'text-amber-600' :
                          tier.color === 'gray' ? 'text-gray-600' :
                          tier.color === 'yellow' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`}>
                          {tier.rate}
                        </div>
                        <h3 className="font-semibold mb-1">{tier.tier}</h3>
                        <p className="text-sm text-muted-foreground">{tier.referrals} referrals</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Commission Details</h4>
                  <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                    <li>• Commissions paid on all subscription revenue for 12 months</li>
                    <li>• Weekly payouts every Friday (minimum $50 balance)</li>
                    <li>• 30-day cookie tracking for maximum attribution</li>
                    <li>• Bonus campaigns and special promotions throughout the year</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  <span>Marketing Resources</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {marketingTools.map((tool, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">{tool.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{tool.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {tool.formats}
                        </Badge>
                        <Button size="sm" variant="ghost" className="text-purple-600">
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tracking & Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Real-time Dashboard</h3>
                    <p className="text-sm text-muted-foreground">Track clicks, conversions, and earnings live</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Performance Analytics</h3>
                    <p className="text-sm text-muted-foreground">Detailed reports and optimization insights</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Share2 className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Link Generator</h3>
                    <p className="text-sm text-muted-foreground">Create custom tracking links instantly</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="join" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Join the HubX Affiliate Program</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-white text-xl font-bold">1</span>
                    </div>
                    <h3 className="font-semibold">Sign Up</h3>
                    <p className="text-sm text-muted-foreground">Complete our simple affiliate application form</p>
                  </div>
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-white text-xl font-bold">2</span>
                    </div>
                    <h3 className="font-semibold">Get Approved</h3>
                    <p className="text-sm text-muted-foreground">Most applications approved within 24-48 hours</p>
                  </div>
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-white text-xl font-bold">3</span>
                    </div>
                    <h3 className="font-semibold">Start Earning</h3>
                    <p className="text-sm text-muted-foreground">Access tools and start promoting immediately</p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg">
                  <h4 className="font-semibold mb-4">Your Referral Code</h4>
                  <div className="flex items-center space-x-2 mb-4">
                    <Input 
                      value={referralCode} 
                      readOnly 
                      className="font-mono"
                    />
                    <Button onClick={copyReferralCode} size="sm">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use this code when applying to get priority approval and bonus welcome rewards.
                  </p>
                </div>

                <div className="text-center space-y-4">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8">
                    <Share2 className="w-5 h-5 mr-2" />
                    Apply for Affiliate Program
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Already an affiliate? <Link to="/auth" className="text-green-600 hover:underline">Sign in to your dashboard</Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <Gift className="w-6 h-6 text-yellow-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">Limited Time Bonus</h3>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-3">
                      Join this month and get a $200 welcome bonus after your first 10 referrals! 
                      Plus double commissions for your first 30 days.
                    </p>
                    <Badge className="bg-yellow-500 text-black font-bold">
                      <Star className="w-3 h-3 mr-1" />
                      Welcome Bonus
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default AffiliatePage;