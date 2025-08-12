
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, FileText, User, CheckCircle, Upload, BarChart3, DollarSign, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [accountType, setAccountType] = useState<'individual' | 'business'>('individual');
  const [isVerified, setIsVerified] = useState(false); // In real app, this would come from user profile

  const handleVerificationStart = () => {
    // In a real app, this would redirect to verification service
    window.open('https://studio.faphouse.com', '_blank');
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="gradient-overlay rounded-lg p-2">
                <span className="text-xl font-bold text-white">HubX</span>
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Creator Studio
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Welcome, {user.email}</span>
              <Button onClick={() => navigate('/')} variant="outline" size="sm">
                Back to Site
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!isVerified ? (
          // Verification Flow
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Creator Verification</h1>
              <p className="text-muted-foreground">
                Complete your verification to start earning on HubX
              </p>
            </div>

            {/* Account Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Account type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Card
                    className={`cursor-pointer transition-all hover:scale-105 ${
                      accountType === 'individual' ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setAccountType('individual')}
                  >
                    <CardContent className="p-6 text-center">
                      <User className="w-12 h-12 mx-auto mb-4 text-primary" />
                      <h3 className="font-semibold text-lg mb-2">Individual</h3>
                      <p className="text-sm text-muted-foreground">
                        Independent models that star in their own content
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all hover:scale-105 ${
                      accountType === 'business' ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setAccountType('business')}
                  >
                    <CardContent className="p-6 text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                      <h3 className="font-semibold text-lg mb-2">Business</h3>
                      <p className="text-sm text-muted-foreground">
                        Producers, studios, content providers
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Verification Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  To start earning on HubX you must verify yourself first. This is needed to:
                </p>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">To show us that you are 18 years old and above</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">To prove us you are entitled to upload the content</span>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg mt-6">
                  <h4 className="font-medium mb-3">To get started, you'll need:</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Camera className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm">Device with camera</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm">Willingness to take a selfie</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm">Identification document</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-green-700 dark:text-green-400">
                      The process is highly secure and it takes less than 5 minutes
                    </span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mt-4">
                  By starting the verification process, you agree that your personal data will be processed by a third-party provider. 
                  You can learn how they process your personal data{' '}
                  <Button variant="link" className="p-0 h-auto text-xs" asChild>
                    <a href="#" className="text-primary">here</a>
                  </Button>.
                </div>

                <Button 
                  onClick={handleVerificationStart} 
                  className="w-full mt-6"
                  size="lg"
                >
                  Start Verification Process
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Verified Creator Dashboard
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Creator Dashboard</h1>
                <p className="text-muted-foreground">Manage your content and earnings</p>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="w-4 h-4 mr-1" />
                Verified
              </Badge>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Videos</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Earnings</p>
                      <p className="text-2xl font-bold">$0.00</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Subscribers</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="dashboard" className="flex items-center space-x-1 text-xs">
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="earnings" className="flex items-center space-x-1 text-xs">
                  <DollarSign className="w-4 h-4" />
                  <span>Earnings</span>
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center space-x-1 text-xs">
                  <Upload className="w-4 h-4" />
                  <span>Upload to HubX</span>
                </TabsTrigger>
                <TabsTrigger value="management" className="flex items-center space-x-1 text-xs">
                  <FileText className="w-4 h-4" />
                  <span>Content Management</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center space-x-1 text-xs">
                  <Settings className="w-4 h-4" />
                  <span>Core Settings</span>
                </TabsTrigger>
                <TabsTrigger value="support" className="flex items-center space-x-1 text-xs">
                  <User className="w-4 h-4" />
                  <span>Support</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">This Month</span>
                          <span className="font-semibold">$0.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Views</span>
                          <span className="font-semibold">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Active Videos</span>
                          <span className="font-semibold">0</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button onClick={() => navigate('/admin')} className="w-full" variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload New Video
                      </Button>
                      <Button className="w-full" variant="outline">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Analytics
                      </Button>
                      <Button className="w-full" variant="outline">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Check Earnings
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="earnings">
                <Card>
                  <CardHeader>
                    <CardTitle>Earnings & Payouts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center p-6 bg-muted/50 rounded-lg">
                        <h3 className="text-2xl font-bold text-green-600">$0.00</h3>
                        <p className="text-sm text-muted-foreground">Available Balance</p>
                      </div>
                      <div className="text-center p-6 bg-muted/50 rounded-lg">
                        <h3 className="text-2xl font-bold">$0.00</h3>
                        <p className="text-sm text-muted-foreground">This Month</p>
                      </div>
                      <div className="text-center p-6 bg-muted/50 rounded-lg">
                        <h3 className="text-2xl font-bold">$0.00</h3>
                        <p className="text-sm text-muted-foreground">Total Earned</p>
                      </div>
                    </div>
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No earnings data available yet. Upload content to start earning!</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="upload">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Content to HubX</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Upload className="w-16 h-16 mx-auto mb-4 text-primary" />
                      <h3 className="text-lg font-semibold mb-2">Share Your Content</h3>
                      <p className="text-muted-foreground mb-6">
                        Upload high-quality videos to engage your audience and start earning
                      </p>
                      <Button onClick={() => navigate('/admin')} size="lg" className="px-8">
                        <Upload className="w-4 h-4 mr-2" />
                        Go to Upload Panel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="management">
                <Card>
                  <CardHeader>
                    <CardTitle>HubX Content Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Manage Your Content</h3>
                      <p className="text-muted-foreground mb-4">
                        View, edit, and manage all your uploaded content
                      </p>
                      <p className="text-sm text-muted-foreground">No content uploaded yet</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Performers Core Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-3">Profile Information</h4>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Account Type: {accountType === 'individual' ? 'Individual Creator' : 'Business Account'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Email: {user.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Status: Verified Creator
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Content Settings</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Auto-publish content</span>
                          <Button variant="outline" size="sm">Configure</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Default privacy settings</span>
                          <Button variant="outline" size="sm">Manage</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="support">
                <Card>
                  <CardHeader>
                    <CardTitle>Support & Help</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline" className="h-16 flex-col">
                        <FileText className="w-6 h-6 mb-2" />
                        Creator Guide
                      </Button>
                      <Button variant="outline" className="h-16 flex-col">
                        <User className="w-6 h-6 mb-2" />
                        Contact Support
                      </Button>
                    </div>
                    
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Need Help?</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Our support team is here to help you succeed on HubX
                      </p>
                      <Button variant="outline" size="sm">
                        Submit Support Ticket
                      </Button>
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={() => {
                          // Add logout logic here
                          navigate('/auth');
                        }}
                      >
                        Logout
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorDashboard;
