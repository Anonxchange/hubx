
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
            <Tabs defaultValue="upload" className="space-y-6">
              <TabsList>
                <TabsTrigger value="upload" className="flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Upload Content</span>
                </TabsTrigger>
                <TabsTrigger value="manage" className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Manage Content</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload New Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Start uploading your content</h3>
                      <p className="text-muted-foreground mb-4">
                        Upload videos to start earning on HubX
                      </p>
                      <Button onClick={() => navigate('/admin')} className="w-full max-w-xs">
                        Go to Upload Panel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="manage">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No content uploaded yet</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle>Analytics & Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Analytics will appear here once you upload content</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Creator Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Profile Information</h4>
                        <p className="text-sm text-muted-foreground">
                          Account Type: {accountType === 'individual' ? 'Individual Creator' : 'Business Account'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Email: {user.email}
                        </p>
                      </div>
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
