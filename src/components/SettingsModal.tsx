
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Lock, 
  Shield, 
  User, 
  Eye, 
  EyeOff, 
  CheckCircle,
  AlertCircle,
  Key,
  Smartphone
} from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Username change state
  const [currentUsername, setCurrentUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showQrSetup, setShowQrSetup] = useState(false);

  // Load user settings on mount
  useEffect(() => {
    if (open && user?.id) {
      loadUserSettings();
    }
  }, [open, user?.id]);

  const loadUserSettings = async () => {
    if (!user?.id) return;

    try {
      // Load profile data including username and 2FA status
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, two_factor_enabled')
        .eq('id', user.id)
        .single();

      if (profile) {
        setCurrentUsername(profile.username || user.email?.split('@')[0] || '');
        setNewUsername(profile.username || user.email?.split('@')[0] || '');
        setTwoFactorEnabled(profile.two_factor_enabled || false);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  // Check username availability
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username === currentUsername) {
      setUsernameAvailable(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user?.id);

      if (error) throw error;
      setUsernameAvailable(data.length === 0);
    } catch (error) {
      console.error('Error checking username availability:', error);
      setUsernameAvailable(null);
    }
  };

  // Handle username input change with debounced availability check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (newUsername !== currentUsername) {
        checkUsernameAvailability(newUsername);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [newUsername, currentUsername]);

  // Handle password change
  const handlePasswordChange = async () => {
    if (!newPassword || !currentPassword) {
      toast({
        title: "Missing information",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);

    try {
      // With Supabase, we can directly update the password without verifying current password
      // The user is already authenticated, so we can proceed with password update
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password update error:', error);
      toast({
        title: "Password update failed",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle username change
  const handleUsernameChange = async () => {
    if (!newUsername || newUsername === currentUsername) {
      toast({
        title: "No changes",
        description: "Please enter a new username.",
        variant: "destructive",
      });
      return;
    }

    if (usernameAvailable === false) {
      toast({
        title: "Username unavailable",
        description: "This username is already taken.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not found. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setUsernameLoading(true);

    try {
      // Use update instead of upsert to ensure we're only updating existing profiles
      const { error } = await supabase
        .from('profiles')
        .update({
          username: newUsername,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Username update error:', error);
        throw error;
      }

      setCurrentUsername(newUsername);
      
      toast({
        title: "Username updated",
        description: "Your username has been successfully changed.",
      });
    } catch (error: any) {
      console.error('Username update failed:', error);
      toast({
        title: "Username update failed",
        description: error.message || "Failed to update username. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUsernameLoading(false);
    }
  };

  // Handle 2FA toggle
  const handle2FAToggle = async (enabled: boolean) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not found. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setTwoFactorLoading(true);

    try {
      if (enabled) {
        // Enable 2FA - would typically generate QR code and secret
        // For demo purposes, we'll simulate the setup process
        setShowQrSetup(true);
        setQrCode('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='); // Placeholder
      } else {
        // Disable 2FA
        const { error } = await supabase
          .from('profiles')
          .update({
            two_factor_enabled: false,
            two_factor_secret: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) {
          console.error('2FA disable error:', error);
          throw error;
        }

        setTwoFactorEnabled(false);
        setShowQrSetup(false);
        
        toast({
          title: "2FA Disabled",
          description: "Two-factor authentication has been disabled for your account.",
        });
      }
    } catch (error: any) {
      console.error('2FA update failed:', error);
      toast({
        title: "2FA update failed",
        description: error.message || "Failed to update 2FA settings.",
        variant: "destructive",
      });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // Verify 2FA setup
  const verify2FASetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not found. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setTwoFactorLoading(true);

    try {
      // In a real implementation, you'd verify the TOTP code here
      // For demo purposes, we'll accept any 6-digit code
      const { error } = await supabase
        .from('profiles')
        .update({
          two_factor_enabled: true,
          two_factor_secret: 'demo_secret_' + Date.now(), // In reality, store the TOTP secret
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('2FA enable error:', error);
        throw error;
      }

      setTwoFactorEnabled(true);
      setShowQrSetup(false);
      setVerificationCode('');
      
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled.",
      });
    } catch (error: any) {
      console.error('2FA verification failed:', error);
      toast({
        title: "2FA verification failed",
        description: error.message || "Failed to verify 2FA setup.",
        variant: "destructive",
      });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-gray-900 border-gray-700 text-white overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <Shield className="w-5 h-5 text-orange-500" />
            <span>Account Settings</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="password" className="data-[state=active]:bg-orange-500">
              <Lock className="w-4 h-4 mr-2" />
              Password
            </TabsTrigger>
            <TabsTrigger value="username" className="data-[state=active]:bg-orange-500">
              <User className="w-4 h-4 mr-2" />
              Username
            </TabsTrigger>
            <TabsTrigger value="2fa" className="data-[state=active]:bg-orange-500">
              <Smartphone className="w-4 h-4 mr-2" />
              2FA
            </TabsTrigger>
          </TabsList>

          {/* Password Tab */}
          <TabsContent value="password" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Key className="w-5 h-5 text-orange-500" />
                  <span>Change Password</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-gray-200">
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white pr-10"
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-gray-200">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white pr-10"
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-200">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white pr-10"
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handlePasswordChange}
                  disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Username Tab */}
          <TabsContent value="username" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <User className="w-5 h-5 text-orange-500" />
                  <span>Change Username</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentUsernameDisplay" className="text-gray-200">
                    Current Username
                  </Label>
                  <Input
                    id="currentUsernameDisplay"
                    value={currentUsername}
                    disabled
                    className="bg-gray-700 border-gray-600 text-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newUsername" className="text-gray-200">
                    New Username
                  </Label>
                  <div className="relative">
                    <Input
                      id="newUsername"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="bg-gray-700 border-gray-600 text-white pr-10"
                      placeholder="Enter new username"
                    />
                    {usernameAvailable === true && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                    {usernameAvailable === false && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                    )}
                  </div>
                  
                  {usernameAvailable === false && (
                    <p className="text-xs text-red-400">This username is already taken</p>
                  )}
                  {usernameAvailable === true && (
                    <p className="text-xs text-green-400">This username is available</p>
                  )}
                  
                  <p className="text-xs text-gray-400">
                    Username can only contain lowercase letters, numbers, and underscores
                  </p>
                </div>

                <Button
                  onClick={handleUsernameChange}
                  disabled={usernameLoading || !newUsername || newUsername === currentUsername || usernameAvailable === false}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  {usernameLoading ? "Updating..." : "Update Username"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2FA Tab */}
          <TabsContent value="2fa" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-orange-500" />
                  <span>Two-Factor Authentication</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-6 h-6 text-orange-500" />
                    <div>
                      <h3 className="text-white font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-400">
                        {twoFactorEnabled ? "Your account is protected with 2FA" : "Add extra security to your account"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={handle2FAToggle}
                    disabled={twoFactorLoading}
                  />
                </div>

                {showQrSetup && (
                  <div className="p-4 bg-gray-700 rounded-lg space-y-4">
                    <h3 className="text-white font-medium">Set up 2FA</h3>
                    <ol className="text-sm text-gray-300 space-y-2">
                      <li>1. Install an authenticator app like Google Authenticator or Authy</li>
                      <li>2. Scan this QR code with your authenticator app</li>
                      <li>3. Enter the 6-digit code from your app to complete setup</li>
                    </ol>
                    
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                      <div className="w-32 h-32 bg-gray-200 flex items-center justify-center text-gray-600 text-xs">
                        QR Code Placeholder<br />
                        (Real implementation would show actual QR code)
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="verificationCode" className="text-gray-200">
                        Verification Code
                      </Label>
                      <Input
                        id="verificationCode"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="bg-gray-600 border-gray-500 text-white text-center text-lg tracking-widest"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={verify2FASetup}
                        disabled={twoFactorLoading || verificationCode.length !== 6}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {twoFactorLoading ? "Verifying..." : "Verify & Enable"}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowQrSetup(false);
                          setVerificationCode('');
                        }}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {twoFactorEnabled && !showQrSetup && (
                  <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                    <div className="flex items-center space-x-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">2FA is enabled</span>
                    </div>
                    <p className="text-sm text-gray-300 mt-2">
                      Your account is protected with two-factor authentication. You'll need to enter a code from your authenticator app when signing in.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
