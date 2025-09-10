import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AdComponent from '@/components/AdComponent';
import OptimizedRelatedVideoCard from '@/components/OptimizedRelatedVideoCard';
import CommentSection from '@/components/CommentSection';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration: string | null;
  views: number | null;
  likes: number | null;
  tags?: string[] | null;
  category?: string | null;
}

interface RelatedVideosProps {
  videos: Video[];
  currentVideo?: Video;
  videoId?: string;
  premiumVideos?: Video[];
}

const RelatedVideos: React.FC<RelatedVideosProps> = ({ videos, currentVideo, videoId, premiumVideos = [] }) => {
  const [visibleCount, setVisibleCount] = useState(10);
  const [activeTab, setActiveTab] = useState('related');
  const [uploaderVideos, setUploaderVideos] = useState<Video[]>([]);
  const [uploaderPlaylists, setUploaderPlaylists] = useState<any[]>([]);

  // Load the ad script asynchronously once
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://a.magsrv.com/ad-provider.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      (window as any).AdProvider = (window as any).AdProvider || [];
      (window as any).AdProvider.push({ serve: {} });
    };
  }, []);

  // Fetch uploader's other videos for recommend tab
  const fetchUploaderVideos = async () => {
    const ownerId = currentVideo?.owner_id || (currentVideo as any)?.profiles?.id;
    if (!ownerId) return;

    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          id, title, thumbnail_url, video_url, views, likes, tags, duration, created_at, is_premium, is_moment,
          profiles:owner_id (id, username, avatar_url, full_name, user_type)
        `)
        .eq('owner_id', ownerId)
        .neq('id', currentVideo.id)
        .eq('is_premium', false)
        .eq('is_moment', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        // Shuffle the videos for randomness
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setUploaderVideos(shuffled);
      }
    } catch (error) {
      console.error('Error fetching uploader videos:', error);
    }
  };

  // Fetch uploader's playlists for playlist tab
  const fetchUploaderPlaylists = async () => {
    const ownerId = currentVideo?.owner_id || (currentVideo as any)?.profiles?.id;
    if (!ownerId) return;

    try {
      // Use the proper service function
      const { getCreatorPublicPlaylists } = await import('@/services/playlistService');
      const playlists = await getCreatorPublicPlaylists(ownerId);
      setUploaderPlaylists(playlists);
      console.log('Fetched creator playlists:', playlists.length, 'playlists for creator:', ownerId);
    } catch (error) {
      console.error('Error fetching uploader playlists:', error);
    }
  };

  // Fetch data when currentVideo changes
  useEffect(() => {
    const ownerId = currentVideo?.owner_id || (currentVideo as any)?.profiles?.id;
    if (ownerId) {
      fetchUploaderVideos();
      fetchUploaderPlaylists();
    }
  }, [currentVideo?.owner_id, currentVideo?.profiles?.id]);

  // Function to calculate relatedness score
  const calculateRelatedness = (video: Video, current: Video): number => {
    let score = 0;

    if (video.category && current.category && video.category === current.category) {
      score += 5;
    }

    if (video.tags && current.tags) {
      const commonTags = video.tags.filter(tag => current.tags?.includes(tag));
      score += commonTags.length * 2;
    }

    if (video.title && current.title) {
      const videoWords = video.title.toLowerCase().split(' ').filter(word => word.length > 3);
      const currentWords = current.title.toLowerCase().split(' ').filter(word => word.length > 3);
      const commonWords = videoWords.filter(word => currentWords.includes(word));
      score += commonWords.length * 0.5;
    }

    return score;
  };

  // Filter and sort videos by relatedness
  const filteredVideos = currentVideo
    ? videos
        .filter(video => video.id !== currentVideo.id)
        .map(video => ({
          ...video,
          relatednessScore: calculateRelatedness(video, currentVideo)
        }))
        .sort((a, b) => b.relatednessScore - a.relatednessScore)
        .filter(video => video.relatednessScore > 0)
    : videos;

  const maxVisible = Math.min(30, filteredVideos.length);
  const canShowMore = visibleCount < maxVisible;

  const handleShowMore = () => {
    setVisibleCount(prev => Math.min(prev + 10, maxVisible));
  };

  const displayedVideos = filteredVideos.slice(0, visibleCount);

  const tabs = [
    { id: 'related', label: 'Related' },
    { id: 'recommend', label: 'Recommend' },
    { id: 'comment', label: 'Comment' },
    { id: 'playlist', label: 'Playlist' },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Horizontal Scroll Tabs */}
      <div className="flex items-center justify-between w-full">
        <div className="flex overflow-x-auto scrollbar-hide w-full">
          <div className="flex space-x-1 min-w-max">
            {tabs.map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="whitespace-nowrap"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'comment' ? (
        /* Comments Section */
        <div className="space-y-6">
          {videoId && <CommentSection videoId={videoId} />}
          {!videoId && (
            <p className="text-muted-foreground text-sm">Video ID not available for comments</p>
          )}
        </div>
      ) : activeTab === 'recommend' ? (
        /* Uploader's Videos */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              More from {currentVideo?.profiles?.username || 'this creator'}
            </h3>
          </div>
          {uploaderVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {uploaderVideos.slice(0, visibleCount).map((video) => (
                <div className="w-full">
                  <OptimizedRelatedVideoCard key={video.id} video={video} viewMode="grid" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p>No other videos from this creator.</p>
            </div>
          )}
          {uploaderVideos.length > visibleCount && (
            <div className="flex justify-center my-6">
              <Button
                onClick={() => setVisibleCount(prev => Math.min(prev + 10, uploaderVideos.length))}
                variant="outline"
                className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-orange-500 transition-colors px-8 py-2 rounded-lg"
              >
                Show More ({Math.min(10, uploaderVideos.length - visibleCount)} more videos)
              </Button>
            </div>
          )}
        </div>
      ) : activeTab === 'playlist' ? (
        /* Uploader's Playlists */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Playlists by {currentVideo?.profiles?.username || 'this creator'}
            </h3>
          </div>
          {uploaderPlaylists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {uploaderPlaylists.map((playlist) => (
                <Link
                  key={playlist.id}
                  to={`/playlist/${playlist.id}`}
                  className="block group w-full"
                >
                  <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={playlist.thumbnail_url || '/placeholder-thumbnail.jpg'}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2">
                      <div className="bg-black bg-opacity-75 rounded px-2 py-1 text-white text-xs font-medium">
                        {playlist.video_count} videos
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {playlist.name}
                    </h4>
                    <div className="flex items-center text-gray-500 text-xs mt-1 space-x-2">
                      <span>{new Date(playlist.created_at).toLocaleDateString()}</span>
                      {playlist.description && (
                        <>
                          <span>•</span>
                          <span className="line-clamp-1">{playlist.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p>No public playlists from this creator.</p>
            </div>
          )}
        </div>
      ) : (
        /* Videos content */
        <div className="space-y-6">
          {/* Desktop Layout with Sidebar for Premium Videos */}
          <div className="flex gap-6">
            {/* Main Content Area */}
            <div className="flex-1">
              {/* Mobile Premium Videos Section - Horizontal scroll */}
              {activeTab === 'related' && premiumVideos.length > 0 && (
                <div className="relative md:hidden mb-6">
                  <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
                    {premiumVideos.slice(0, 6).map((premiumVideo, index) => (
                      <div key={`premium-${premiumVideo.id}-${index}`} className="flex-shrink-0 w-64 relative">
                        <Link to={`/premium/video/${premiumVideo.id}`} className="block w-full group hover:bg-muted/5 transition-all duration-200">
                          <div
                            className="relative bg-muted overflow-hidden rounded-xl w-full"
                            style={{ 
                              aspectRatio: '16/9', 
                              height: 'auto'
                            }}
                          >
                            <img
                              src={premiumVideo.thumbnail_url || '/placeholder-thumbnail.jpg'}
                              alt={premiumVideo.title}
                              className="w-full h-full object-cover transition-opacity duration-300"
                              loading="lazy"
                            />
                            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                              {premiumVideo.duration}
                            </div>
                            {/* Crown icon overlay */}
                            <div className="absolute top-2 left-2 z-20">
                              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm2.7-2h8.6l.9-5.4-2.1 1.4L12 8l-3.1 2L6.8 8.6L7.7 14z"/>
                              </svg>
                            </div>
                          </div>
                          <div className="pt-3 space-y-2">
                            <h3 className="font-semibold text-sm line-clamp-2 leading-tight text-foreground">{premiumVideo.title}</h3>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs text-white font-bold">
                                  {premiumVideo.profiles?.avatar_url || premiumVideo.uploader_avatar ? (
                                    <img
                                      src={premiumVideo.profiles?.avatar_url || premiumVideo.uploader_avatar}
                                      alt="Creator"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    (premiumVideo.profiles?.username || premiumVideo.uploader_username || 'U')[0].toUpperCase()
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {premiumVideo.profiles?.username || premiumVideo.uploader_username || premiumVideo.uploader_name || 'Creator'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                                </svg>
                                {premiumVideo.views || 0} views
                              </span>
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                                </svg>
                                {premiumVideo.likes || 0}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                  {/* Gradient fade on right edge */}
                  <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-background to-transparent pointer-events-none"></div>
                </div>
              )}

              {/* Regular Videos Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {displayedVideos.map((video, index) => (
                  <div key={video.id} className="w-full">
                    <OptimizedRelatedVideoCard video={video} viewMode="grid" />
                    {index === 5 && (
                      <div className="my-4 md:hidden">
                        {/* Ad placeholder, script loads via useEffect */}
                        <ins className="eas6a97888e37" data-zoneid="5686642"></ins>
                      </div>
                    )}
                  </div>
                ))}

                {/* Show More Button */}
                {canShowMore && (
                  <div className="col-span-full flex justify-center my-6">
                    <Button
                      onClick={handleShowMore}
                      variant="outline"
                      className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-orange-500 transition-colors px-8 py-2 rounded-lg"
                    >
                      Show More ({Math.min(10, maxVisible - visibleCount)} more videos)
                    </Button>
                  </div>
                )}

                {/* Last ad after all videos */}
                {filteredVideos.length > 0 && visibleCount >= filteredVideos.length && (
                  <div className="my-4">
                    <AdComponent zoneId="5661270" />
                  </div>
                )}

                {filteredVideos.length === 0 && (
                  <p className="text-muted-foreground text-sm">No related videos found</p>
                )}
              </div>
            </div>

            
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default RelatedVideos;