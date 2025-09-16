
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Heart } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OptimizedVideoGrid from '@/components/OptimizedVideoGrid';
import AdComponent from '@/components/AdComponent';

// Generate or get anonymous session ID
const getSessionId = () => {
  let sessionId = localStorage.getItem('anonymous_session_id');
  if (!sessionId) {
    sessionId = 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('anonymous_session_id', sessionId);
  }
  return sessionId;
};

const FavoritesPage = () => {
  const { user, loading } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching user profile:', error);
          } else {
            setUserProfile(profile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    const fetchFavorites = async () => {
      setFavoritesLoading(true);
      try {
        const sessionId = user?.id || getSessionId();
        
        const { data: favorites, error } = await supabase
          .from('video_favorites')
          .select(`
            video_id,
            videos (
              id,
              title,
              thumbnail_url,
              preview_url,
              video_url,
              duration,
              views,
              likes,
              description,
              tags,
              owner_id,
              created_at,
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
          .eq('user_session', sessionId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching favorites:', error);
          setFavorites([]);
        } else {
          // Transform the data to match the expected format for OptimizedVideoGrid
          const validFavorites = favorites?.map(fav => {
            const video = fav.videos;
            if (!video) return null;
            
            return {
              ...video,
              uploader_username: video.profiles?.username || 'Unknown User',
              uploader_name: video.profiles?.full_name || video.profiles?.username || 'Unknown User',
              uploader_avatar: video.profiles?.avatar_url,
              uploader_type: video.profiles?.user_type || 'user',
              uploader_id: video.profiles?.id,
              video_url: video.video_url || '',
              duration: video.duration || '0:00',
              views: video.views || 0,
              likes: video.likes || 0,
              tags: video.tags || []
            };
          }).filter(Boolean) || [];
          
          setFavorites(validFavorites);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
        setFavorites([]);
      } finally {
        setFavoritesLoading(false);
      }
    };

    fetchFavorites();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Ad Component */}
        <div className="mb-8">
          <AdComponent zoneId="5660534" className="w-full" />
        </div>

        <div className="flex items-center space-x-3 mb-8">
          <Heart className="w-8 h-8 text-red-500" />
          <h1 className="text-3xl font-bold text-white">My Favorites</h1>
        </div>

        {favoritesLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading your favorites...</p>
          </div>
        ) : favorites.length > 0 ? (
          <OptimizedVideoGrid 
            videos={favorites} 
            viewMode="grid" 
            showAds={false}
            showMoments={false}
            showPremiumSection={false}
            showTags={true}
            showDate={false}
          />
        ) : (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto text-gray-600 mb-6" />
            <h2 className="text-2xl font-semibold mb-4 text-white">No favorites yet</h2>
            <p className="text-gray-400 text-lg mb-8">
              Videos you like will appear here. Start exploring to build your collection!
            </p>
            <a 
              href="/" 
              className="inline-flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
            >
              Explore Videos
            </a>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default FavoritesPage;
