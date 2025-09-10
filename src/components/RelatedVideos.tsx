import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AdComponent from '@/components/AdComponent';
import OptimizedRelatedVideoCard from '@/components/OptimizedRelatedVideoCard';
import CommentSection from '@/components/CommentSection';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration: string | null;
  views: number | null;
  likes: number | null;
  tags?: string[] | null;
  category?: string | null;
  profiles?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  uploader_avatar?: string | null;
  uploader_username?: string | null;
  uploader_name?: string | null;
}

interface RelatedVideosProps {
  videos: Video[];
  currentVideo?: Video;
  videoId?: string;
  premiumVideos?: Video[];
}

const RelatedVideos: React.FC<RelatedVideosProps> = ({
  videos,
  currentVideo,
  videoId,
  premiumVideos = [],
}) => {
  const [visibleCount, setVisibleCount] = useState(10);
  const [activeTab, setActiveTab] = useState('related');
  const [uploaderVideos, setUploaderVideos] = useState<Video[]>([]);
  const [uploaderPlaylists, setUploaderPlaylists] = useState<any[]>([]);

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

  const fetchUploaderVideos = async () => {
    const ownerId = currentVideo?.owner_id || (currentVideo as any)?.profiles?.id;
    if (!ownerId) return;

    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          id, title, thumbnail_url, video_url, views, likes, tags, duration, created_at, is_premium, is_moment,
          profiles:owner_id (id, username, avatar_url)
        `)
        .eq('owner_id', ownerId)
        .neq('id', currentVideo?.id)
        .eq('is_premium', false)
        .eq('is_moment', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setUploaderVideos(shuffled);
      }
    } catch (error) {
      console.error('Error fetching uploader videos:', error);
    }
  };

  const fetchUploaderPlaylists = async () => {
    const ownerId = currentVideo?.owner_id || (currentVideo as any)?.profiles?.id;
    if (!ownerId) return;

    try {
      const { getCreatorPublicPlaylists } = await import('@/services/playlistService');
      const playlists = await getCreatorPublicPlaylists(ownerId);
      setUploaderPlaylists(playlists);
    } catch (error) {
      console.error('Error fetching uploader playlists:', error);
    }
  };

  useEffect(() => {
    const ownerId = currentVideo?.owner_id || (currentVideo as any)?.profiles?.id;
    if (ownerId) {
      fetchUploaderVideos();
      fetchUploaderPlaylists();
    }
  }, [currentVideo?.owner_id, currentVideo?.profiles?.id]);

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
      const videoWords = video.title.toLowerCase().split(' ').filter(w => w.length > 3);
      const currentWords = current.title.toLowerCase().split(' ').filter(w => w.length > 3);
      const commonWords = videoWords.filter(w => currentWords.includes(w));
      score += commonWords.length * 0.5;
    }

    return score;
  };

  const filteredVideos = currentVideo
    ? videos
        .filter(v => v.id !== currentVideo.id)
        .map(v => ({ ...v, relatednessScore: calculateRelatedness(v, currentVideo) }))
        .sort((a, b) => b.relatednessScore - a.relatednessScore)
        .filter(v => v.relatednessScore > 0)
    : videos;

  const maxVisible = Math.min(30, filteredVideos.length);
  const canShowMore = visibleCount < maxVisible;
  const displayedVideos = filteredVideos.slice(0, visibleCount);

  const tabs = [
    { id: 'related', label: 'Related' },
    { id: 'recommend', label: 'Recommend' },
    { id: 'comment', label: 'Comment' },
    { id: 'playlist', label: 'Playlist' },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Tabs */}
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

      {/* Comment Tab */}
      {activeTab === 'comment' && (
        <div className="space-y-6">
          {videoId ? (
            <CommentSection videoId={videoId} />
          ) : (
            <p className="text-muted-foreground text-sm">Video ID not available for comments</p>
          )}
        </div>
      )}

      {/* Recommend Tab */}
      {activeTab === 'recommend' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">
            More from {currentVideo?.profiles?.username || 'this creator'}
          </h3>
          {uploaderVideos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
              {uploaderVideos.slice(0, visibleCount).map(video => (
                <OptimizedRelatedVideoCard key={video.id} video={video} viewMode="grid" />
              ))}
            </div>
          ) : (
            <p className="p-4 text-center text-gray-500">No other videos from this creator.</p>
          )}
        </div>
      )}

      {/* Playlist Tab */}
      {activeTab === 'playlist' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">
            Playlists by {currentVideo?.profiles?.username || 'this creator'}
          </h3>
          {uploaderPlaylists.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploaderPlaylists.map(playlist => (
                <Link key={playlist.id} to={`/playlist/${playlist.id}`} className="block group">
                  <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={playlist.thumbnail_url || '/placeholder-thumbnail.jpg'}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {playlist.video_count} videos
                    </div>
                  </div>
                  <h4 className="mt-2 font-semibold text-sm line-clamp-2">{playlist.name}</h4>
                </Link>
              ))}
            </div>
          ) : (
            <p className="p-4 text-center text-gray-500">No public playlists.</p>
          )}
        </div>
      )}

      {/* Related Tab */}
      {activeTab === 'related' && (
        <div className="space-y-8">
          {/* Premium Horizontal Scroll (mobile only) */}
          {premiumVideos.length > 0 && (
            <div className="md:hidden">
              <h3 className="text-base font-semibold mb-3 px-1">Premium Picks</h3>
              <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
                {premiumVideos.slice(0, 6).map(premiumVideo => (
                  <div
                    key={premiumVideo.id}
                    className="flex-shrink-0 w-48 relative rounded-lg overflow-hidden"
                  >
                    <Link to={`/premium/video/${premiumVideo.id}`} className="block">
                      <div className="aspect-video bg-muted">
                        <img
                          src={premiumVideo.thumbnail_url || '/placeholder-thumbnail.jpg'}
                          alt={premiumVideo.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="mt-2 text-sm font-semibold line-clamp-2">
                        {premiumVideo.title}
                      </h3>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayedVideos.map(video => (
              <OptimizedRelatedVideoCard key={video.id} video={video} viewMode="grid" />
            ))}
          </div>

          {/* Show More Button */}
          {canShowMore && (
            <div className="flex justify-center">
              <Button
                onClick={() => setVisibleCount(prev => Math.min(prev + 10, maxVisible))}
                variant="outline"
              >
                Show More
              </Button>
            </div>
          )}
        </div>
      )}

      <Footer />
    </div>
  );
};

export default RelatedVideos;