import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Video, Star, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<'user' | 'creator'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { user_type: userType },
      },
    });
    if (error) {
      toast({
        title: 'Google Auth Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleTwitterAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: window.location.origin,
        queryParams: { user_type: userType },
      },
    });
    if (error) {
      toast({
        title: 'Twitter Auth Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && password !== confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Login Failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Welcome Back!',
            description: 'You have successfully logged in.',
          });
          navigate('/');
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: firstName,
              last_name: lastName,
              user_type: userType,
            },
          },
        });

        if (error) {
          toast({
            title: 'Sign Up Failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Account Created!',
            description: 'Check your email to verify your account.',
          });
        }
      }
    } catch (err: any) {
      toast({
        title: 'Unexpected Error',
        description: err.message || 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            to="/"
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <Link to="/" className="flex items-center space-x-2">
            <div className="gradient-overlay rounded-lg p-2">
              <span className="text-xl font-bold text-white">HubX</span>
            </div>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* User Type Selection */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-center mb-4">
            {isLogin ? 'Welcome Back' : 'Join HubX'}
          </h1>
          <div className="grid grid-cols-2 gap-3">
            <Card
              className={`cursor-pointer transition-all hover:scale-105 ${
                userType === 'user' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setUserType('user')}
            >
              <CardContent className="p-4 text-center">
                <User className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">User</h3>
                <p className="text-sm text-muted-foreground">Watch & enjoy content</p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all hover:scale-105 ${
                userType === 'creator' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setUserType('creator')}
            >
              <CardContent className="p-4 text-center">
                <Video className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                <h3 className="font-semibold">Creator</h3>
                <p className="text-sm text-muted-foreground">Earn with HubX</p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  <DollarSign className="w-3 h-3 mr-1" />
                  Monetize
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Creator Benefits */}
        {userType === 'creator' && (
          <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg border">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-orange-700 dark:text-orange-400">
                Creator Benefits
              </h3>
            </div>
            <ul className="space-y-1 text-sm text-orange-600 dark:text-orange-300">
              <li>• Upload and monetize your content</li>
              <li>• Earn revenue from views and subscriptions</li>
              <li>• Build your audience and brand</li>
              <li>• Analytics and performance insights</li>
            </ul>
          </div>
        )}

        {/* Auth Form */}
        <Card>
          <CardHeader>
            <Tabs value={isLogin ? 'login' : 'signup'} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" onClick={() => setIsLogin(true)}>
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup" onClick={() => setIsLogin(false)}>
                  Sign Up
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'} as{' '}
                {userType === 'creator' ? 'Creator' : 'User'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Social Login */}
        <div className="mt-6 space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full" onClick={handleGoogleAuth}>
              Google
            </Button>
            <Button variant="outline" className="w-full" onClick={handleTwitterAuth}>
              Twitter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;