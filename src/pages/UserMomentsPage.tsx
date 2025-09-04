
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Play, Heart, Eye, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import VerificationBadge from '@/components/VerificationBadge';

interface UserMoment {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  duration: string;
  views: number;
  likes: number;
  created_at: string;
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  user_type: string;
  bio?: string;
}

const UserMomentsPage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [moments, setMoments] = useState<UserMoment[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserMoments = async () => {
      if (!username) return;

      try {
        setLoading(true);

        // First get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, user_type, bio')
          .eq('username', username)
          .single();

        if (profileError || !profileData) {
          console.error('Profile not found:', profileError);
          setLoading(false);
          return;
        }

        setProfile(profileData);

        // Get user's moments
        const { data: momentsData, error: momentsError } = await supabase
          .from('videos')
          .select('id, title, video_url, thumbnail_url, duration, views, likes, created_at')
          .eq('owner_id', profileData.id)
          .eq('is_moment', true)
          .order('created_at', { ascending: false });

        if (momentsError) {
          console.error('Error fetching moments:', momentsError);
        } else {
          setMoments(momentsData || []);
        }

        // Get subscriber count
        const { count: subCount } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact' })
          .eq('creator_id', profileData.id);

        setSubscriberCount(subCount || 0);

        // Get total video count
        const { count: totalVideos } = await supabase
          .from('videos')
          .select('*', { count: 'exact' })
          .eq('owner_id', profileData.id);

        setVideoCount(totalVideos || 0);

      } catch (error) {
        console.error('Error fetching user moments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserMoments();
  }, [username]);

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleMomentClick = (momentId: string) => {
    navigate(`/moments?start=${momentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
        <Button onClick={() => navigate('/')} variant="outline" className="text-white border-white">
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-semibold">Moments</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Profile Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-xl">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Plus icon for subscribe */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-black">
              <span className="text-black font-bold text-lg">+</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h2 className="text-xl font-bold">{profile.full_name || profile.username}</h2>
              {(profile.user_type === 'individual_creator' || profile.user_type === 'studio_creator') && (
                <VerificationBadge userType={profile.user_type} showText={false} />
              )}
            </div>
            <p className="text-gray-400 text-sm mb-2">@{profile.username}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-300">
              <span><strong>{formatCount(subscriberCount)}</strong> Subscribers</span>
              <span><strong>{formatCount(videoCount)}</strong> Videos</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button 
            className="flex-1 bg-white text-black font-medium hover:bg-gray-200"
            onClick={() => navigate(`/profile/${username}`)}
          >
            View full profile
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 border-primary text-primary hover:bg-primary hover:text-black"
            onClick={() => {
              if (profile.website) {
                window.open(profile.website, '_blank', 'noopener,noreferrer');
              } else {
                // Could show a toast or alert that no website is set
                alert('No website link available for this user');
              }
            }}
            disabled={!profile.website}
          >
            More of Me →
          </Button>
        </div>

        {profile.bio && (
          <p className="text-gray-300 text-sm mt-4">{profile.bio}</p>
        )}
      </div>

      {/* Moments Grid */}
      <div className="p-4">
        {moments.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {moments.map((moment) => (
              <div
                key={moment.id}
                className="relative aspect-[9/16] rounded-lg overflow-hidden bg-gray-900 cursor-pointer group"
                onClick={() => handleMomentClick(moment.id)}
              >
                {/* Thumbnail */}
                {moment.thumbnail_url ? (
                  <img
                    src={moment.thumbnail_url}
                    alt={moment.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white/60" />
                  </div>
                )}

                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
                  </div>
                </div>

                {/* Duration */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {moment.duration}
                </div>

                {/* Stats overlay */}
                <div className="absolute bottom-2 left-2 flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-white text-xs">
                    <Eye className="w-3 h-3" />
                    <span>{formatCount(moment.views)}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-white text-xs">
                    <Heart className="w-3 h-3" />
                    <span>{formatCount(moment.likes)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Play className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Moments Yet</h3>
            <p className="text-gray-400">
              {profile.full_name || profile.username} hasn't shared any moments yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMomentsPage;
