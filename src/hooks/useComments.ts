
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getComments, addComment, CommentInsert } from '@/services/commentsService';
import { toast } from 'sonner';

export const useComments = (videoId: string) => {
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading, error } = useQuery({
    queryKey: ['comments', videoId],
    queryFn: () => getComments(videoId),
    enabled: !!videoId,
  });

  const addCommentMutation = useMutation({
    mutationFn: (comment: CommentInsert) => addComment(comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', videoId] });
      toast.success('Comment added successfully!');
    },
    onError: (error) => {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment. Please try again.');
    },
  });

  return {
    comments,
    isLoading,
    error,
    addComment: addCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,
  };
};
