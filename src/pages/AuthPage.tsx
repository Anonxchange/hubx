import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Video, Star, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<'user' | 'creator'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) setError(error.message);
        else navigate('/'); // Redirect after login success
      } else {
        const { error } = await signUp(email, password, userType);
        if (error) setError(error.message);
        else setError('Check your email for a confirmation link'); // Signup success message
      }
    } catch (e) {
      setError('Unexpected error occurred');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
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
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* User Type Selection */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-center mb-4">
              {isLogin ? 'Welcome Back' : 'Join HubX'}
            </h1>
            <div className="grid grid-cols-2 gap-3">
              <Card
                className={`cursor-pointer transition-all hover:scale-105 ${userType === 'user' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setUserType('user')}
              >
                <CardContent className="p-4 text-center">
                  <User className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold">User</h3>
                  <p className="text-sm text-muted-foreground">Watch & enjoy content</p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all hover:scale-105 ${userType === 'creator' ? 'ring-2 ring-primary' : ''}`}
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
                <h3 className="font-semibold text-orange-700 dark:text-orange-400">Creator Benefits</h3>
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
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading
                    ? 'Please wait...'
                    : `${isLogin ? 'Login' : 'Create Account'} as ${
                        userType === 'creator' ? 'Creator' : 'User'
                      }`}
                </Button>

                {isLogin && (
                  <div className="text-center mt-2">
                    <Button variant="link" className="text-sm text-muted-foreground">
                      Forgot your password?
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Social Login Options */}
          {/* (You can add social login logic here later) */}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;