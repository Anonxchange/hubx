import React, { useState } from 'react';
import { VideoIcon, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import ImageStylePagination from '@/components/ImageStylePagination';
import VideoEditModal from './VideoEditModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteVideo, Video } from '@/services/videosService';
import { useVideos } from '@/hooks/useVideos';

const VideoManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  
  const { data: videosData } = useVideos(currentPage, 40);
  const videos = videosData?.videos || [];
  const totalPages = videosData?.totalPages || 1;

  const deleteMutation = useMutation({
    mutationFn: deleteVideo,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete video. Please try again.",
        variant: "destructive",
      });
      console.error('Delete error:', error);
    },
  });

  const handleDelete = (videoId: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      deleteMutation.mutate(videoId);
    }
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <VideoIcon className="w-5 h-5" />
            <span>Manage Videos ({videosData?.totalCount || 0} total)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {videos.map((video) => (
              <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <img
                    src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=100&h=60&fit=crop'}
                    alt={video.title}
                    className="w-16 h-10 object-cover rounded"
                  />
                  <div>
                    <h3 className="font-medium">{video.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {video.views} views • {video.likes || 0} likes • {video.dislikes || 0} dislikes
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {video.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {video.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{video.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                 </div>
                 <div className="flex items-center space-x-2">
                   <Button
                     onClick={() => handleEdit(video)}
                     variant="outline"
                     size="sm"
                   >
                     <Edit className="w-4 h-4" />
                   </Button>
                   <Button
                     onClick={() => handleDelete(video.id)}
                     variant="destructive"
                     size="sm"
                     disabled={deleteMutation.isPending}
                   >
                     <Trash2 className="w-4 h-4" />
                   </Button>
                 </div>
              </div>
            ))}
            
            {videos.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No videos uploaded yet.
              </p>
            )}
          </div>
          
          {/* Pagination */}
          <ImageStylePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      <VideoEditModal
        video={editingVideo}
        isOpen={editingVideo !== null}
        onClose={() => setEditingVideo(null)}
      />
    </>
  );
};

export default VideoManagement;