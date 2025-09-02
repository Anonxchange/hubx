
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, User, Shield, Bell, Globe, CreditCard, Camera, Lock, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';

interface PayoutMethod {
  id: string;
  method_type: 'paypal' | 'crypto' | 'bank_transfer';
  details: any;
  is_default: boolean;
  created_at: string;
}

const CoreSettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutMethodType, setPayoutMethodType] = useState<'paypal' | 'crypto' | 'bank_transfer'>('paypal');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [settings, setSettings] = useState({
    displayName: '',
    bio: '',
    profilePicture: '',
    coverPhoto: '',
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      profilePublic: true,
      showOnlineStatus: true,
      allowMessages: true
    },
    content: {
      autoPublish: false,
      adultContent: true,
      contentRating: 'explicit'
    }
  });

  useEffect(() => {
    if (user?.id) {
      fetchPayoutMethods();
      fetchUserSettings();
    }
  }, [user?.id]);

  const fetchPayoutMethods = async () => {
    if (!user?.id) return;

    try {
      // For now, we'll store payout methods as part of user profile
      // In a real implementation, you'd have a separate payout_methods table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('payout_methods')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching payout methods:', error);
        return;
      }

      if (profile?.payout_methods) {
        setPayoutMethods(profile.payout_methods);
      }
    } catch (error) {
      console.error('Error fetching payout methods:', error);
    }
  };

  const fetchUserSettings = async () => {
    if (!user?.id) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('display_name, bio, avatar_url, cover_photo_url, settings')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user settings:', error);
        return;
      }

      if (profile) {
        setSettings(prev => ({
          ...prev,
          displayName: profile.display_name || '',
          bio: profile.bio || '',
          profilePicture: profile.avatar_url || '',
          coverPhoto: profile.cover_photo_url || '',
          ...(profile.settings || {})
        }));
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: settings.displayName,
          bio: settings.bio,
          settings: {
            notifications: settings.notifications,
            privacy: settings.privacy,
            content: settings.content
          }
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayoutMethod = async () => {
    if (!user?.id || !payoutDetails.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required details.",
        variant: "destructive"
      });
      return;
    }

    try {
      let details: any = {};
      if (payoutMethodType === 'paypal') {
        details = { email: payoutDetails };
      } else if (payoutMethodType === 'crypto') {
        details = { wallet_address: payoutDetails };
      } else if (payoutMethodType === 'bank_transfer') {
        details = { account_details: payoutDetails };
      }

      const newMethod: PayoutMethod = {
        id: Date.now().toString(),
        method_type: payoutMethodType,
        details,
        is_default: payoutMethods.length === 0,
        created_at: new Date().toISOString()
      };

      const updatedMethods = [...payoutMethods, newMethod];

      const { error } = await supabase
        .from('profiles')
        .update({ payout_methods: updatedMethods })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setPayoutMethods(updatedMethods);
      setShowPayoutModal(false);
      setPayoutDetails('');
      
      toast({
        title: "Success",
        description: "Payout method added successfully."
      });
    } catch (error) {
      console.error('Error adding payout method:', error);
      toast({
        title: "Error",
        description: "Failed to add payout method.",
        variant: "destructive"
      });
    }
  };

  const handleRemovePayoutMethod = async (methodId: string) => {
    if (!user?.id) return;

    try {
      const updatedMethods = payoutMethods.filter(method => method.id !== methodId);

      const { error } = await supabase
        .from('profiles')
        .update({ payout_methods: updatedMethods })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setPayoutMethods(updatedMethods);
      
      toast({
        title: "Success",
        description: "Payout method removed successfully."
      });
    } catch (error) {
      console.error('Error removing payout method:', error);
      toast({
        title: "Error",
        description: "Failed to remove payout method.",
        variant: "destructive"
      });
    }
  };

  const handleSetDefaultPayoutMethod = async (methodId: string) => {
    if (!user?.id) return;

    try {
      const updatedMethods = payoutMethods.map(method => ({
        ...method,
        is_default: method.id === methodId
      }));

      const { error } = await supabase
        .from('profiles')
        .update({ payout_methods: updatedMethods })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setPayoutMethods(updatedMethods);
      
      toast({
        title: "Success",
        description: "Default payout method updated."
      });
    } catch (error) {
      console.error('Error updating default payout method:', error);
      toast({
        title: "Error",
        description: "Failed to update default payout method.",
        variant: "destructive"
      });
    }
  };

  const getPayoutMethodDisplay = (method: PayoutMethod) => {
    if (method.method_type === 'paypal') {
      return `PayPal: ${method.details.email}`;
    } else if (method.method_type === 'crypto') {
      return `Crypto: ${method.details.wallet_address.substring(0, 10)}...`;
    } else if (method.method_type === 'bank_transfer') {
      return `Bank Transfer: ${method.details.account_details.substring(0, 20)}...`;
    }
    return method.method_type;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mr-4 text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Core Settings</h1>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="billing">Billing & Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Profile Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={settings.displayName}
                    onChange={(e) => setSettings(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Enter your display name"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={settings.bio}
                    onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell your audience about yourself..."
                    className="bg-gray-800 border-gray-700 min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Profile Picture</Label>
                    <Button variant="outline" className="w-full justify-start">
                      <Camera className="w-4 h-4 mr-2" />
                      Upload Profile Picture
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Cover Photo</Label>
                    <Button variant="outline" className="w-full justify-start">
                      <Camera className="w-4 h-4 mr-2" />
                      Upload Cover Photo
                    </Button>
                  </div>
                </div>

                <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
                  {loading ? 'Saving...' : 'Save Profile Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-400">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, email: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-400">Receive browser push notifications</p>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, push: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-400">Receive SMS notifications</p>
                  </div>
                  <Switch
                    checked={settings.notifications.sms}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, sms: checked }
                      }))
                    }
                  />
                </div>

                <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
                  {loading ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Privacy Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Public Profile</Label>
                    <p className="text-sm text-gray-400">Make your profile visible to everyone</p>
                  </div>
                  <Switch
                    checked={settings.privacy.profilePublic}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        privacy: { ...prev.privacy, profilePublic: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Online Status</Label>
                    <p className="text-sm text-gray-400">Let others see when you're online</p>
                  </div>
                  <Switch
                    checked={settings.privacy.showOnlineStatus}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        privacy: { ...prev.privacy, showOnlineStatus: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Messages</Label>
                    <p className="text-sm text-gray-400">Allow users to send you messages</p>
                  </div>
                  <Switch
                    checked={settings.privacy.allowMessages}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        privacy: { ...prev.privacy, allowMessages: checked }
                      }))
                    }
                  />
                </div>

                <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
                  {loading ? 'Saving...' : 'Save Privacy Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Content Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-publish Content</Label>
                    <p className="text-sm text-gray-400">Automatically publish uploaded content</p>
                  </div>
                  <Switch
                    checked={settings.content.autoPublish}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        content: { ...prev.content, autoPublish: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Adult Content</Label>
                    <p className="text-sm text-gray-400">Mark content as adult content</p>
                  </div>
                  <Switch
                    checked={settings.content.adultContent}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        content: { ...prev.content, adultContent: checked }
                      }))
                    }
                  />
                </div>

                <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
                  {loading ? 'Saving...' : 'Save Content Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Billing & Payout Methods</span>
                  </div>
                  <Dialog open={showPayoutModal} onOpenChange={setShowPayoutModal}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Method
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-800 text-white">
                      <DialogHeader>
                        <DialogTitle>Add Payout Method</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="method">Payout Method</Label>
                          <Select value={payoutMethodType} onValueChange={(value: any) => setPayoutMethodType(value)}>
                            <SelectTrigger className="bg-gray-800 border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="paypal">PayPal</SelectItem>
                              <SelectItem value="crypto">Cryptocurrency</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="details">
                            {payoutMethodType === 'paypal' && 'PayPal Email'}
                            {payoutMethodType === 'crypto' && 'Wallet Address'}
                            {payoutMethodType === 'bank_transfer' && 'Bank Account Details'}
                          </Label>
                          <Textarea
                            id="details"
                            value={payoutDetails}
                            onChange={(e) => setPayoutDetails(e.target.value)}
                            placeholder={
                              payoutMethodType === 'paypal' ? 'your@email.com' :
                              payoutMethodType === 'crypto' ? 'Your wallet address' :
                              'Bank account details'
                            }
                            className="bg-gray-800 border-gray-700"
                          />
                        </div>
                        <Button onClick={handleAddPayoutMethod} className="w-full">
                          Add Payout Method
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payoutMethods.length > 0 ? (
                  <div className="space-y-4">
                    {payoutMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <CreditCard className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="font-medium">{getPayoutMethodDisplay(method)}</p>
                            <p className="text-sm text-gray-400">
                              Added: {new Date(method.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {method.is_default && (
                            <Badge className="bg-green-500">Default</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {!method.is_default && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefaultPayoutMethod(method.id)}
                            >
                              Set Default
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemovePayoutMethod(method.id)}
                            className="text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-lg font-semibold mb-2">No payout methods</h3>
                    <p className="text-gray-400 mb-6">
                      Add payment methods to receive payouts
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CoreSettingsPage;
