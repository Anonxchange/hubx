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
  const [accountType] = useState<'individual' | 'business'>('individual');

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

      {/* Creator Dashboard */}
      <div className="container mx-auto px-4 py-8">
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

            {/* Dashboard Tab */}
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
                    <Button onClick={() => navigate('/upload')} className="w-full" variant="outline">
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

            {/* Earnings Tab */}
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

            {/* Upload Tab */}
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
                    <Button onClick={() => navigate('/upload')} size="lg" className="px-8">
                      <Upload className="w-4 h-4 mr-2" />
                      Go to Upload Panel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Management Tab */}
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

            {/* Settings Tab */}
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

            {/* Support Tab */}
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
      </div>
    </div>
  );
};

export default CreatorDashboard;