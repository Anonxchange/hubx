
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Crown, Star, Shield, Eye, Clock, ThumbsUp, CreditCard, Share, Heart, MessageSquare, Download, MoreHorizontal, ChevronDown } from 'lucide-react';
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

const PremiumVideoPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [videoError, setVideoError] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('12months');

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black text-white">
        <PremiumHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-purple-500/20 rounded w-24"></div>
            <div className="aspect-video bg-purple-500/20 rounded-lg"></div>
            <div className="h-8 bg-purple-500/20 rounded w-3/4"></div>
            <div className="h-4 bg-purple-500/20 rounded w-1/2"></div>
          </div>
        </main>
        <PremiumFooter />
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
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black text-xs px-3 py-1 h-7">
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

      {/* Full-width Video Player */}
      <div className="relative aspect-video bg-black">
        <PremiumVideoPlayer
          src={video.video_url || ''}
          poster={video.thumbnail_url || ''}
          title={video.title || ''}
          isPremium={true}
          quality="4K"
        />
        {videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white text-lg">
            Failed to load premium video.
          </div>
        )}
        
        {/* Mute/Sound Button */}
        <button className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded">
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Video Title */}
      <div className="px-4 py-4">
        <h1 className="text-lg font-semibold text-white leading-tight mb-2">
          {video.title}
        </h1>
        <p className="text-xs text-gray-400 mb-3">15:08</p>
        
        {/* Creator Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1494790108755-2616b612b547?w=100&h=100&fit=crop&crop=face" 
                alt="Creator" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-white text-sm font-medium">ManuelaAlvarez</span>
          </div>
          
          <Button 
            onClick={() => setShowSubscriptionModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm px-4 py-2 rounded-full"
          >
            <Star className="w-4 h-4 mr-1" />
            Send gift
          </Button>
        </div>
      </div>

      {/* Subscription Modal */}
      <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md mx-auto rounded-lg">
          <div className="space-y-4">
            {/* Trial Option */}
            <div 
              className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer ${
                selectedPlan === 'trial' ? 'border-yellow-400 bg-gray-800' : 'border-gray-600 bg-gray-800'
              }`}
              onClick={() => setSelectedPlan('trial')}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedPlan === 'trial' ? 'border-yellow-400 bg-yellow-400' : 'border-gray-400'
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
              className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer ${
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
              className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer ${
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
              className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer ${
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
              className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer ${
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
                <button className="text-blue-400">Sign in</button>
              </div>

              <Button className="w-full bg-white text-black border border-gray-300">
                <span className="mr-2">G</span>
                Sign up with Google
              </Button>

              <div className="text-center text-gray-400 text-xs">
                — or continue with email —
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Username" 
                    className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-3 text-white placeholder-gray-400"
                  />
                </div>
                <div className="relative">
                  <input 
                    type="email" 
                    placeholder="Your email" 
                    className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-3 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="text-xs text-gray-400">
                By creating account, you agree to our Terms and Conditions & Privacy Policy
              </div>

              <Button className="w-full bg-yellow-500 text-black font-bold text-lg py-4">
                <Crown className="w-5 h-5 mr-2" />
                GET FULL VIDEO
              </Button>

              <div className="text-xs text-gray-400 text-center">
                Payments are processed by EPOCH. Billed as $35.88<br />
                Followed by a payment of $35.88 after 12 months.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            <img 
              src="https://images.unsplash.com/photo-1494790108755-2616b612b547?w=100&h=100&fit=crop&crop=face" 
              alt="Creator" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-white text-sm">ManuelaAlvarez</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {['Amateur', '18 Year Old', 'Colombian', 'Brunette', 'Eating Pussy', 'Latina'].map((tag) => (
            <Badge key={tag} className="bg-gray-800 text-gray-300 border-gray-600 text-xs">
              {tag}
            </Badge>
          ))}
          <button className="bg-gray-800 text-gray-300 border border-gray-600 rounded px-2 py-1 text-xs">
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumVideoPage;
