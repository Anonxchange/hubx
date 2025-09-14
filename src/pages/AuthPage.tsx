
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, User, Video, Star, DollarSign, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<'user' | 'individual_creator' | 'studio_creator'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [confirmationSuccess, setConfirmationSuccess] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const { signIn, signUp, signOut, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('confirmed') === 'true') {
      signOut();
      setConfirmationSuccess(true);
      setIsLogin(true);
      navigate('/auth', { replace: true });
    }

    if (searchParams.get('reset') === 'true') {
      setResetPasswordMode(true);
      setIsLogin(true);
      setShowForgotPassword(false);
      navigate('/auth', { replace: true });
    }
  }, [searchParams, signOut, navigate]);

  const handleGoogleAuth = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await forgotPassword(email);
      if (error) {
        setError(error.message);
      } else {
        setResetEmailSent(true);
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setError(error.message);
      } else {
        setResetPasswordMode(false);
        setConfirmationSuccess(true);
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await signIn(email, password, userType);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Please check your email and click the confirmation link');
          } else if (error.message.includes('User type mismatch')) {
            setError('You are registered as a different user type. Please select the correct user type.');
          } else {
            setError(error.message);
          }
        } else {
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password, userType);
        if (error) {
          if (error.message.includes('User already registered')) {
            setError('An account with this email already exists');
          } else if (error.message.includes('Password should be at least')) {
            setError('Password must be at least 6 characters long');
          } else if (error.message.includes('Database error') || error.code === 'unexpected_failure') {
            setError('Account created but there was a database issue. Please try logging in.');
          } else {
            setError(error.message || 'Failed to create account');
          }
        } else {
          setEmailSent(true);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/auth-background.jpeg)',
          filter: 'brightness(0.3)'
        }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Header */}
      <div className="relative z-10 border-b border-gray-800/50 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
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
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Join HubX'}
            </h1>
            <p className="text-gray-300">
              {isLogin ? 'Sign in to access premium content' : 'Create your account to get started'}
            </p>
          </div>

          {/* User Type Selection */}
          <div className="mb-6 grid grid-cols-3 gap-2">
            <div
              className={`cursor-pointer transition-all p-3 rounded-lg border-2 text-center ${
                userType === 'user' 
                  ? 'border-purple-500 bg-purple-500/20' 
                  : 'border-gray-600 bg-black/40 hover:border-gray-500'
              }`}
              onClick={() => setUserType('user')}
            >
              <User className="w-5 h-5 mx-auto mb-1 text-purple-500" />
              <h3 className="font-semibold text-white text-sm">User</h3>
              <p className="text-xs text-gray-400">Watch content</p>
            </div>

            <div
              className={`cursor-pointer transition-all p-3 rounded-lg border-2 text-center ${
                userType === 'individual_creator' 
                  ? 'border-purple-500 bg-purple-500/20' 
                  : 'border-gray-600 bg-black/40 hover:border-gray-500'
              }`}
              onClick={() => setUserType('individual_creator')}
            >
              <Video className="w-5 h-5 mx-auto mb-1 text-purple-500" />
              <h3 className="font-semibold text-white text-sm">Creator</h3>
              <p className="text-xs text-gray-400">Upload & earn</p>
              <Badge variant="secondary" className="mt-1 text-xs bg-purple-600/20 text-purple-400">
                <DollarSign className="w-2 h-2 mr-1" />
                Earn
              </Badge>
            </div>

            <div
              className={`cursor-pointer transition-all p-3 rounded-lg border-2 text-center ${
                userType === 'studio_creator' 
                  ? 'border-purple-500 bg-purple-500/20' 
                  : 'border-gray-600 bg-black/40 hover:border-gray-500'
              }`}
              onClick={() => setUserType('studio_creator')}
            >
              <Star className="w-5 h-5 mx-auto mb-1 text-purple-500" />
              <h3 className="font-semibold text-white text-sm">Studio</h3>
              <p className="text-xs text-gray-400">Professional</p>
              <Badge variant="secondary" className="mt-1 text-xs bg-purple-600/20 text-purple-400">
                <DollarSign className="w-2 h-2 mr-1" />
                Pro
              </Badge>
            </div>
          </div>

          {/* Auth Form */}
          <Card className="bg-black/60 border-gray-700 backdrop-blur-sm">
            <CardHeader className="pb-4">
              {!showForgotPassword && !resetPasswordMode && (
                <Tabs value={isLogin ? 'login' : 'signup'} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
                    <TabsTrigger 
                      value="login" 
                      onClick={() => setIsLogin(true)}
                      className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                    >
                      Login
                    </TabsTrigger>
                    <TabsTrigger 
                      value="signup" 
                      onClick={() => setIsLogin(false)}
                      className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </CardHeader>

            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-600/50 rounded-md">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {confirmationSuccess && (
                <div className="mb-4 p-3 bg-green-900/50 border border-green-600/50 rounded-md">
                  <p className="text-sm text-green-300">
                    {resetPasswordMode ? 'Password reset successfully! You can now log in.' : 'Email confirmed successfully! You can now log in.'}
                  </p>
                </div>
              )}

              {!isLogin && emailSent && (
                <div className="mb-4 p-3 bg-green-900/50 border border-green-600/50 rounded-md">
                  <p className="text-sm text-green-300">
                    A confirmation email has been sent. Please check your inbox and click the confirmation link.
                  </p>
                </div>
              )}

              {resetEmailSent && (
                <div className="mb-4 p-3 bg-green-900/50 border border-green-600/50 rounded-md">
                  <p className="text-sm text-green-300">
                    Password reset email sent! Please check your inbox and follow the instructions.
                  </p>
                </div>
              )}

              {showForgotPassword && !resetEmailSent ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Email'}
                  </Button>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setError(null);
                      }}
                      className="text-sm text-gray-400 hover:text-white"
                    >
                      Back to Login
                    </Button>
                  </div>
                </form>
              ) : resetPasswordMode ? (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-white">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword" className="text-white">Confirm New Password</Label>
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your password"
                          className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3" 
                    disabled={loading || (!isLogin && emailSent)}
                  >
                    {loading
                      ? 'Please wait...'
                      : isLogin 
                        ? `Login as ${
                            userType === 'individual_creator' ? 'Creator' :
                            userType === 'studio_creator' ? 'Studio' : 'User'
                          }`
                        : `Join as ${
                            userType === 'individual_creator' ? 'Creator' :
                            userType === 'studio_creator' ? 'Studio' : 'User'
                          }`}
                  </Button>

                  {isLogin && (
                    <div className="text-center">
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setError(null);
                          setEmail('');
                        }}
                        className="text-sm text-gray-400 hover:text-white"
                      >
                        Forgot your password?
                      </Button>
                    </div>
                  )}
                </form>
              )}

              {/* Social Login */}
              {!showForgotPassword && !resetPasswordMode && (
                <div className="mt-6 space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-black/60 px-2 text-gray-400">Or continue with</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full bg-white hover:bg-gray-100 text-gray-800 border-gray-300" 
                    onClick={handleGoogleAuth}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Age Verification Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              By creating an account, you confirm that you are 18+ and agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
