
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import OptimizedVideoGrid from '@/components/OptimizedVideoGrid';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdComponent from '@/components/AdComponent';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  preview_url?: string;
  duration: string;
  views: number;
  likes: number;
  tags: string[];
  created_at: string;
  uploader_username?: string;
  uploader_type?: 'user' | 'creator' | 'studio' | 'individual_creator' | 'studio_creator';
  is_premium?: boolean;
  owner_id?: string;
  profiles?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    user_type: string;
  };
  uploader_name?: string;
  uploader_avatar?: string;
  uploader_id?: string;
}

interface WatchLaterItem {
  id: string;
  created_at: string;
  video: Video;
}

const WatchLaterPage: React.FC = () => {
  const { user } = useAuth();
  const [watchLaterVideos, setWatchLaterVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWatchLaterVideos();
    }
  }, [user]);

  const fetchWatchLaterVideos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('watch_later')
        .select(`
          id,
          created_at,
          videos (
            id,
            title,
            description,
            video_url,
            thumbnail_url,
            preview_url,
            duration,
            views,
            likes,
            tags,
            created_at,
            owner_id,
            is_premium,
            profiles (
              id,
              username,
              full_name,
              avatar_url,
              user_type
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching watch later videos:', error);
      } else {
        const formattedData = data?.map((item: any) => ({
          ...item.videos,
          uploader_username: item.videos.profiles?.username,
          uploader_name: item.videos.profiles?.full_name,
          uploader_avatar: item.videos.profiles?.avatar_url,
          uploader_type: item.videos.profiles?.user_type,
          uploader_id: item.videos.profiles?.id
        })) || [];
        setWatchLaterVideos(formattedData);
      }
    } catch (error) {
      console.error('Error in fetchWatchLaterVideos:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearAllWatchLater = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('watch_later')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing watch later:', error);
      } else {
        setWatchLaterVideos([]);
      }
    } catch (error) {
      console.error('Error in clearAllWatchLater:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Sign in to access Watch Later</h2>
              <p className="text-muted-foreground">
                Create an account or sign in to save videos for later viewing.
              </p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-4">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Clock className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Watch Later
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your saved videos ({watchLaterVideos.length})
          </p>
        </div>

        {/* Ad Code Below Hero Text */}
        <AdComponent zoneId="5660534" />

        {/* Clear All Button */}
        {watchLaterVideos.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={clearAllWatchLater}
              className="flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All</span>
            </Button>
          </div>
        )}

        {/* Videos */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted"></div>
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : watchLaterVideos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No videos in Watch Later</h2>
              <p className="text-muted-foreground">
                Videos you add to Watch Later will appear here. Start browsing to add some videos!
              </p>
            </CardContent>
          </Card>
        ) : (
          <OptimizedVideoGrid 
            videos={watchLaterVideos} 
            viewMode="grid" 
            showAds={true} 
            showMoments={false} 
            showPremiumSection={false}
            showTags={false}
            showDate={false}
            isWatchLaterPage={true}
          />
        )}

        {/* Ad Code Before Footer */}
        <AdComponent zoneId="5661270" className="my-8" />
      </main>

      <Footer />
    </div>
  );
};

export default WatchLaterPage;
