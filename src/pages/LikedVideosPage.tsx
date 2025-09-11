
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ThumbsUp, Play, Eye, Clock, Star, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdComponent from '@/components/AdComponent';
import ImageStylePagination from '@/components/ImageStylePagination';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface LikedVideo {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  duration?: string;
  views?: number;
  likes?: number;
  created_at: string;
  is_moment?: boolean;
  is_premium?: boolean;
  liked_at: string;
  profiles?: {
    username: string;
    full_name?: string;
    avatar_url?: string;
    user_type: string;
  };
}

const LikedVideosPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [likedVideos, setLikedVideos] = useState<LikedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const videosPerPage = 24;

  useEffect(() => {
    if (user) {
      fetchLikedVideos();
    }
  }, [user, currentPage]);

  const fetchLikedVideos = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get total count first
      const { count } = await supabase
        .from('video_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('reaction_type', 'like');

      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / videosPerPage));

      // Get paginated liked videos
      const { data, error } = await supabase
        .from('video_reactions')
        .select(`
          created_at,
          videos (
            id,
            title,
            description,
            thumbnail_url,
            duration,
            views,
            likes,
            created_at,
            is_moment,
            is_premium,
            profiles (
              username,
              full_name,
              avatar_url,
              user_type
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('reaction_type', 'like')
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * videosPerPage, currentPage * videosPerPage - 1);

      if (error) {
        console.error('Error fetching liked videos:', error);
        return;
      }

      const formattedVideos = data?.map(item => ({
        ...item.videos,
        liked_at: item.created_at
      })) || [];

      setLikedVideos(formattedVideos);
    } catch (error) {
      console.error('Error fetching liked videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video: LikedVideo) => {
    if (video.is_moment) {
      navigate(`/moments?start=${video.id}`);
    } else if (video.is_premium) {
      navigate(`/premium/video/${video.id}`);
    } else {
      navigate(`/video/${video.id}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Sign in to view liked videos</h2>
              <p className="text-muted-foreground">
                Create an account or sign in to see your liked videos.
              </p>
              <Button onClick={() => navigate('/auth')} className="mt-4">
                Sign In
              </Button>
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

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Heart className="h-8 w-8 text-red-500" />
            <ThumbsUp className="h-6 w-6 text-blue-500" />
            <Star className="h-6 w-6 text-yellow-500" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-red-500 via-blue-500 to-yellow-500 bg-clip-text text-transparent">
            Liked Videos
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your collection of liked videos ({totalCount.toLocaleString()})
          </p>
          
          {/* Stats Badges */}
          <div className="flex justify-center space-x-2 mt-4">
            <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
              <Heart className="h-3 w-3 mr-1" />
              Liked
            </Badge>
            <Badge variant="outline">
              <ThumbsUp className="h-3 w-3 mr-1" />
              {totalCount.toLocaleString()} Videos
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              <Star className="h-3 w-3 mr-1" />
              Personal Collection
            </Badge>
          </div>
        </div>

        {/* Ad Component */}
        <AdComponent zoneId="5660534" />

        {/* Videos Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted"></div>
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : likedVideos.length > 0 ? (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                Your Liked Videos
              </h2>
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} • {totalCount.toLocaleString()} videos
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {likedVideos.map((video) => (
                <Card 
                  key={video.id} 
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border-0 bg-card"
                  onClick={() => handleVideoClick(video)}
                >
                  <div className="relative aspect-video overflow-hidden">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Play className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Overlay badges */}
                    <div className="absolute top-2 left-2 flex flex-col space-y-1">
                      <Badge className="bg-red-500/90 text-white text-xs font-bold">
                        <Heart className="w-3 h-3 mr-1" />
                        LIKED
                      </Badge>
                      {video.is_premium && (
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold">
                          PREMIUM
                        </Badge>
                      )}
                      {video.is_moment && (
                        <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold">
                          MOMENT
                        </Badge>
                      )}
                    </div>

                    {/* Duration */}
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </div>
                    )}

                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                        <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold line-clamp-2 text-sm leading-tight group-hover:text-primary transition-colors">
                      {video.title}
                    </h3>
                    
                    {video.profiles && (
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {video.profiles.avatar_url ? (
                            <img src={video.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-medium">
                              {(video.profiles.full_name || video.profiles.username).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground truncate">
                          {video.profiles.full_name || video.profiles.username}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{video.views?.toLocaleString() || 0}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Heart className="w-3 h-3" />
                          <span>{video.likes?.toLocaleString() || 0}</span>
                        </span>
                      </div>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Liked {formatDate(video.liked_at)}</span>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <ImageStylePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Card className="border-muted/50 bg-muted/5">
              <CardContent className="p-8">
                <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No liked videos yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start exploring and liking videos to build your personal collection!
                </p>
                <Button onClick={() => navigate('/')}>
                  Discover Videos
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default LikedVideosPage;
