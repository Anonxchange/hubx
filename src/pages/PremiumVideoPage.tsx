import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Crown, Star, Shield, Eye, Clock, ThumbsUp, CreditCard, Share, Heart, MessageSquare, Download, MoreHorizontal, ChevronDown, Play } from 'lucide-react';
import PremiumHeader from '@/components/PremiumHeader';
import PremiumFooter from '@/components/PremiumFooter';
import PremiumVideoPlayer from '@/components/PremiumVideoPlayer';
import { getVideoById, incrementViews } from '@/services/videosService';
import { useRelatedVideos } from '@/hooks/useVideos';
import { useVideoReaction } from '@/hooks/useVideoReactions';
import { trackVideoView } from '@/services/userStatsService';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import PremiumVideoCard from '@/components/PremiumVideoCard';
import SubscriptionModal from '@/components/SubscriptionModal';
import { supabase } from '@/integrations/supabase/client';

const PremiumVideoPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [videoError, setVideoError] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('12months');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'creditcard' | 'paypal' | 'crypto'>('creditcard');
  const [selectedCrypto, setSelectedCrypto] = useState('btc');
  const [isSignIn, setIsSignIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { data: video, isLoading, error } = useQuery({
    queryKey: ['premium-video', id],
    queryFn: () => getVideoById(id!),
    enabled: !!id,
    retry: false,
  });

  const { data: relatedVideos = [] } = useRelatedVideos(
    video?.id || '',
    video?.tags || [],
    12
  );

  const { userReaction, reactToVideo, isLoading: reactionMutationPending } =
    useVideoReaction(video?.id || '');

  useEffect(() => {
    if (video?.id) {
      incrementViews(video.id).catch(() => {});
      const isValidUUID = user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id);
      if (isValidUUID) {
        trackVideoView(video.id, user.id).catch(err => {
          console.log("Premium video tracking error:", err);
        });
      }
    }
  }, [video?.id, user?.id]);

  if (isLoading || !id) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Top Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 text-xs bg-black border-b border-gray-800">
          <div className="flex items-center space-x-1">
            <div className="w-1 h-1 bg-red-500 rounded-full"></div>
            <span>Live</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-4 bg-gray-600 rounded-full relative">
              <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 right-0.5"></div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="bg-black px-4 py-3 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="flex items-center space-x-4">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Loading Video Player */}
        <div className="aspect-video bg-black animate-pulse">
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <div className="text-white">Loading...</div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="bg-black px-4 py-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-800 rounded w-3/4"></div>
            <div className="h-4 bg-gray-800 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black text-white">
        <PremiumHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-white">Premium Video Not Found</h1>
            <p className="text-gray-400 mb-4">
              {error?.message || "The premium video you're looking for doesn't exist or could not be loaded."}
            </p>
            <Link to="/premium" className="text-yellow-400 hover:text-yellow-300 transition-colors">
              Go back to Premium
            </Link>
          </div>
        </main>
        <PremiumFooter />
      </div>
    );
  }

  const handleVideoError = () => {
    setVideoError(true);
  };

  const handleVideoCanPlay = () => {
    setVideoError(false);
  };

  const handleReaction = (reactionType: 'like' | 'dislike') => {
    if (video?.id) {
      reactToVideo({ videoId: video.id, reactionType });
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSubscriptionSuccess = () => {
    setShowSubscriptionModal(false);
    // Refresh the page to update premium status
    window.location.reload();
  };

  const plans = [
    {
      id: '2day',
      title: '2-day trial',
      subtitle: 'Limited access',
      price: '$0.99',
      amount: 0.99,
      period: '/2 days',
      badge: 'TRY IT',
      badgeColor: 'bg-red-500',
      recommended: false
    },
    {
      id: '12months',
      title: '12 months',
      subtitle: '',
      price: '$2.99',
      amount: 35.88,
      period: '/month',
      badge: '40% OFF',
      badgeColor: 'bg-red-500',
      recommended: true
    },
    {
      id: '3months',
      title: '3 months',
      subtitle: '',
      price: '$3.99',
      amount: 11.97,
      period: '/month',
      badge: '20% OFF',
      badgeColor: 'bg-red-500',
      recommended: false
    },
    {
      id: '1month',
      title: '1 month',
      subtitle: '',
      price: '$4.99',
      amount: 4.99,
      period: '/month',
      badge: '',
      badgeColor: '',
      recommended: false
    },
    {
      id: 'lifetime',
      title: 'Lifetime',
      subtitle: 'Use forever',
      price: '$399.99',
      amount: 399.99,
      period: '',
      badge: 'Use forever',
      badgeColor: 'bg-red-500',
      recommended: false
    }
  ];

  const selectedPlanData = plans.find(plan => plan.id === selectedPlan);

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Calculate expiration date based on selected plan
      const now = new Date();
      let expiresAt = new Date();

      switch (selectedPlan) {
        case '2day':
        case 'trial':
          expiresAt.setDate(now.getDate() + 2);
          break;
        case '1month':
          expiresAt.setMonth(now.getMonth() + 1);
          break;
        case '3months':
          expiresAt.setMonth(now.getMonth() + 3);
          break;
        case '12months':
          expiresAt.setFullYear(now.getFullYear() + 1);
          break;
        case 'lifetime':
          expiresAt.setFullYear(now.getFullYear() + 100);
          break;
        default:
          expiresAt.setMonth(now.getMonth() + 1);
      }

      // First check if user already has a subscription
      const { data: existingSub } = await supabase
        .from('premium_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let subscriptionResult;
      
      if (existingSub) {
        // Update existing subscription
        subscriptionResult = await supabase
          .from('premium_subscriptions')
          .update({
            plan_name: selectedPlanData?.title || selectedPlan,
            plan_type: selectedPlan,
            payment_method: paymentMethod,
            amount: selectedPlanData?.amount || 0,
            currency: 'USD',
            status: 'active',
            is_active: true,
            payment_id: paymentData.id,
            payment_data: paymentData,
            start_date: now.toISOString(),
            end_date: expiresAt.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('user_id', user.id);
      } else {
        // Create new subscription
        subscriptionResult = await supabase
          .from('premium_subscriptions')
          .insert({
            user_id: user.id,
            plan_name: selectedPlanData?.title || selectedPlan,
            plan_type: selectedPlan,
            payment_method: paymentMethod,
            amount: selectedPlanData?.amount || 0,
            currency: 'USD',
            status: 'active',
            is_active: true,
            payment_id: paymentData.id,
            payment_data: paymentData,
            start_date: now.toISOString(),
            end_date: expiresAt.toISOString(),
            created_at: now.toISOString(),
            updated_at: now.toISOString()
          });
      }

      if (subscriptionResult.error) {
        console.error('Supabase error:', subscriptionResult.error);
        throw new Error(`Failed to save subscription: ${subscriptionResult.error.message}`);
      }

      alert(`Payment successful! Your ${selectedPlanData?.title} subscription is now active until ${expiresAt.toLocaleDateString()}.`);
      window.location.reload();
    } catch (error) {
      console.error('Payment verification error:', error);
      alert(`Payment processing failed: ${error.message}. Please try again.`);
      throw error;
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError(null);
    setIsProcessing(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setAuthError(error.message);
        setIsProcessing(false);
      }
    } catch (error) {
      setAuthError('Failed to authenticate with Google');
      setIsProcessing(false);
    }
  };

  const handleGetMembership = async () => {
    // If not authenticated, handle authentication first
    if (!user) {
      if (!email || !password) {
        setAuthError('Please fill in email and password');
        return;
      }

      setAuthError(null);
      setIsProcessing(true);

      try {
        let authResult;
        if (isSignIn) {
          authResult = await supabase.auth.signInWithPassword({
            email,
            password
          });
        } else {
          authResult = await supabase.auth.signUp({
            email,
            password
          });
        }

        if (authResult.error) {
          setAuthError(authResult.error.message);
          setIsProcessing(false);
          return;
        }

        // If sign up, show confirmation message
        if (!isSignIn && !authResult.data.user?.email_confirmed_at) {
          setAuthError('Please check your email to confirm your account before proceeding with payment.');
          setIsProcessing(false);
          return;
        }
      } catch (error: any) {
        setAuthError('An unexpected error occurred');
        setIsProcessing(false);
        return;
      }
    }

    // Process payment
    setIsProcessing(true);
    try {
      const planAmount = selectedPlanData?.amount;
      if (planAmount === undefined) {
        throw new Error('Selected plan amount is undefined.');
      }

      // For demo purposes, simulate successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await handlePaymentSuccess({ 
        id: `demo_${Date.now()}`, 
        status: 'COMPLETED',
        paymentMethod: paymentMethod,
        amount: planAmount,
        currency: 'USD'
      });

    } catch (error) {
      console.error('Payment error:', error);
      alert(`Payment failed: ${error.message}. Please try again.`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 text-xs bg-black border-b border-gray-800">
        <div className="flex items-center space-x-1">
          <div className="w-1 h-1 bg-red-500 rounded-full"></div>
          <span>Live</span>
          <Heart className="w-3 h-3 text-pink-500 ml-2" />
          <span>Sex Chat</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">VR Only</span>
          <div className="w-8 h-4 bg-gray-600 rounded-full relative">
            <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 right-0.5"></div>
          </div>
          <div className="relative">
            <Heart className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-3 h-3 flex items-center justify-center text-white text-[8px]">2</span>
          </div>
          <MoreHorizontal className="w-4 h-4" />
        </div>
      </div>

      {/* Header */}
      <div className="bg-black px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Crown className="w-8 h-8 text-yellow-400" />
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <span className="text-black text-xs font-bold">20</span>
              </div>
            </div>
            <CreditCard className="w-5 h-5 text-gray-400" />
            <ArrowLeft className="w-5 h-5 text-gray-400" onClick={() => navigate('/premium')} />
            <Button 
              onClick={() => setShowSubscriptionModal(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black text-xs px-3 py-1 h-7"
            >
              Join now
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto bg-black border-b border-gray-800 px-4">
        {['Videos', 'VR Porn', 'Categories', 'Pornstars', 'Channels', 'Community'].map((tab, index) => (
          <button
            key={tab}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap ${
              index === 0
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Video Player - Completely No Container */}
      <PremiumVideoPlayer
        src={video.video_url || ''}
        poster={video.thumbnail_url || ''}
        title={video.title || ''}
        isPremium={true}
        quality="4K"
      />

      {/* Video Info - Directly under video */}
      <div className="bg-black">
        {/* Video Title */}
        <div className="px-4 py-4">
          <h1 className="text-lg font-semibold text-white leading-tight mb-2">
            {video.title || "I Give My New Stepsister a Nice Fuck for the First Time to Her"}
          </h1>

          {/* Creator Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                {(video.profiles?.avatar_url || video.uploader_avatar) ? (
                  <img
                    src={video.profiles?.avatar_url || video.uploader_avatar}
                    alt={video.uploader_username || "Creator"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const parent = target.parentElement;
                      if (parent) {
                        const username = video.uploader_username || video.profiles?.username || video.uploader_name || "User";
                        parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">${username.charAt(0).toUpperCase()}</div>`;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                    {(video.uploader_username || video.profiles?.username || video.uploader_name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-white text-sm font-medium">{video.uploader_username || video.uploader_name || "Creator"}</span>
            </div>

            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm px-4 py-2 rounded-full"
            >
              <Star className="w-4 h-4 mr-1" />
              Send gift
            </Button>
          </div>
        </div>

        {/* Subscription Options - Directly on page */}
        <div className="px-4 py-4 bg-gray-900">
          {/* Trial Option */}
          <div
            className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer mb-3 ${
              selectedPlan === '2day' ? 'border-yellow-400 bg-gray-800' : 'border-gray-600 bg-gray-800'
            }`}
            onClick={() => setSelectedPlan('2day')}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedPlan === '2day' ? 'border-yellow-400 bg-yellow-400' : 'border-gray-400'
              }`}></div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-white">2-day trial</span>
                  <Badge className="bg-red-600 text-white text-xs">TRY IT</Badge>
                </div>
                <span className="text-gray-400 text-sm">Limited access</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold">$0.99</div>
              <div className="text-gray-400 text-xs">/2 days</div>
            </div>
          </div>

          {/* 12 Months Option */}
          <div
            className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer mb-3 ${
              selectedPlan === '12months' ? 'border-yellow-400 bg-yellow-500' : 'border-gray-600 bg-yellow-500'
            }`}
            onClick={() => setSelectedPlan('12months')}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedPlan === '12months' ? 'border-black bg-black' : 'border-black'
              }`}></div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-black font-medium">12 months</span>
                  <Badge className="bg-red-600 text-white text-xs">40% OFF</Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-black font-bold">$2.99</div>
              <div className="text-black text-xs">/month</div>
            </div>
          </div>

          {/* 3 Months Option */}
          <div
            className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer mb-3 ${
              selectedPlan === '3months' ? 'border-yellow-400 bg-gray-800' : 'border-gray-600 bg-gray-800'
            }`}
            onClick={() => setSelectedPlan('3months')}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedPlan === '3months' ? 'border-yellow-400 bg-yellow-400' : 'border-gray-400'
              }`}></div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-white">3 months</span>
                  <Badge className="bg-red-600 text-white text-xs">20% OFF</Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold">$3.99</div>
              <div className="text-gray-400 text-xs">/month</div>
            </div>
          </div>

          {/* 1 Month Option */}
          <div
            className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer mb-3 ${
              selectedPlan === '1month' ? 'border-yellow-400 bg-gray-800' : 'border-gray-600 bg-gray-800'
            }`}
            onClick={() => setSelectedPlan('1month')}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedPlan === '1month' ? 'border-yellow-400 bg-yellow-400' : 'border-gray-400'
              }`}></div>
              <span className="text-white">1 month</span>
            </div>
            <div className="text-right">
              <div className="text-white font-bold">$4.99</div>
              <div className="text-gray-400 text-xs">/month</div>
            </div>
          </div>

          {/* Lifetime Option */}
          <div
            className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer mb-4 ${
              selectedPlan === 'lifetime' ? 'border-yellow-400 bg-gray-800' : 'border-gray-600 bg-gray-800'
            }`}
            onClick={() => setSelectedPlan('lifetime')}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedPlan === 'lifetime' ? 'border-yellow-400 bg-yellow-400' : 'border-gray-400'
              }`}></div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-white">Lifetime</span>
                  <Badge className="bg-red-600 text-white text-xs">Use forever</Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold">$399.99</div>
              <div className="text-gray-400 text-xs">/once</div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="flex space-x-2 py-4">
            <Button className="flex-1 bg-yellow-500 text-black">
              <CreditCard className="w-4 h-4 mr-2" />
              Credit card
            </Button>
            <Button className="flex-1 bg-blue-600 text-white">
              PayPal
            </Button>
            <Button className="flex-1 bg-orange-500 text-white">
              Cryptocoins
            </Button>
          </div>

          {/* Sign Up Options */}
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-white">Create account or </span>
              <button className="text-blue-400" onClick={() => setIsSignIn(!isSignIn)}>
                {isSignIn ? "Sign up" : "Sign in"}
              </button>
            </div>

            <Button 
              onClick={handleGoogleAuth}
              className="w-full bg-white text-black border border-gray-300"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </Button>

            <div className="text-center text-gray-400 text-xs">
              — or continue with email —
            </div>

            <div className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-3 text-white placeholder-gray-400"
                />
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-3 text-white placeholder-gray-400"
                />
              </div>
            </div>

            {authError && (
              <div className="text-red-400 text-xs text-center">{authError}</div>
            )}

            <div className="text-xs text-gray-400">
              By creating account, you agree to our Terms and Conditions & Privacy Policy
            </div>

            <Button 
              onClick={handleGetMembership}
              disabled={isProcessing}
              className="w-full bg-yellow-500 text-black font-bold text-lg py-4 disabled:opacity-50"
            >
              <Crown className="w-5 h-5 mr-2" />
              {isProcessing ? 'PROCESSING...' : 'GET FULL VIDEO'}
            </Button>

            <div className="text-xs text-gray-400 text-center">
              Payments are processed by <span className="text-green-400">EPOCH</span>. Billed as $35.88<br />
              Followed by a payment of $35.88 after 12 months.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 py-4 bg-gray-900">
          <button className="flex flex-col items-center bg-gray-800 p-3 rounded-lg">
            <Heart className="w-5 h-5 text-white mb-1" />
            <span className="text-xs text-white">538</span>
          </button>
          <button className="flex flex-col items-center bg-gray-800 p-3 rounded-lg">
            <MessageSquare className="w-5 h-5 text-white mb-1" />
          </button>
          <button className="flex flex-col items-center bg-gray-800 p-3 rounded-lg">
            <Download className="w-5 h-5 text-white mb-1" />
          </button>
          <button className="flex flex-col items-center bg-gray-800 p-3 rounded-lg">
            <Share className="w-5 h-5 text-white mb-1" />
          </button>
          <button className="flex flex-col items-center bg-gray-800 p-3 rounded-lg">
            <MoreHorizontal className="w-5 h-5 text-white mb-1" />
          </button>
        </div>

        {/* Video Info */}
        <div className="px-4 py-3 bg-black">
          <p className="text-gray-400 text-sm mb-2">Published: 14.12.2024</p>
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-gray-400 text-sm">More info</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>

          {/* Creator Profile */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
              {(video.profiles?.avatar_url || video.uploader_avatar) ? (
                <img
                  src={video.profiles?.avatar_url || video.uploader_avatar}
                  alt={video.uploader_username || "Creator"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    if (parent) {
                      const username = video.uploader_username || video.profiles?.username || video.uploader_name || "User";
                      parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">${username.charAt(0).toUpperCase()}</div>`;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                  {(video.uploader_username || video.profiles?.username || video.uploader_name || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-white text-sm">{video.uploader_username || video.uploader_name || "Creator"}</span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {['Amateur', 'Blowjob', 'Brunette', '18 Year Old', 'Colombian', 'Eating Pussy', 'Latina'].map((tag) => (
              <Badge key={tag} className="bg-gray-800 text-gray-300 border-gray-600 text-xs">
                {tag}
              </Badge>
            ))}
            <button className="bg-gray-800 text-gray-300 border border-gray-600 rounded px-2 py-1 text-xs">
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* More Premium Videos Section */}
        {relatedVideos.length > 0 && (
          <div className="bg-black px-4 py-6">
            <h3 className="text-white text-lg font-bold mb-4 flex items-center">
              <Crown className="w-5 h-5 text-yellow-400 mr-2" />
              More Premium Content
            </h3>

            <div className="space-y-0">
              {relatedVideos.slice(0, 6).map((relatedVideo) => (
                <div key={relatedVideo.id} className="relative">
                  <div className="relative aspect-video bg-black">
                    <img
                      src={relatedVideo.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=450&fit=crop'}
                      alt={relatedVideo.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                    {/* Premium badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-yellow-500 text-black text-xs font-bold px-2 py-1">
                        <Crown className="w-3 h-3 mr-1" />
                        PREMIUM
                      </Badge>
                    </div>

                    {/* Play button */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="bg-black/50 text-white p-3 rounded-full">
                        <Play className="w-6 h-6" fill="currentColor" />
                      </div>
                    </div>

                    {/* Video info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Crown className="w-4 h-4 text-black" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-sm leading-tight mb-1 line-clamp-2">
                            {relatedVideo.title}
                          </h4>
                          <p className="text-gray-300 text-xs">
                            {relatedVideo.uploader_username || relatedVideo.uploader_name || "Premium Creator"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="absolute bottom-3 right-3">
                      <span className="bg-black/80 text-white text-xs px-2 py-1 rounded">
                        {relatedVideo.duration || '15:30'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subscription Modal */}
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          onSubscriptionSuccess={handleSubscriptionSuccess}
        />
      </div>
    </div>
  );
};

export default PremiumVideoPage;