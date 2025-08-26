import React, { useState } from 'react';
import { Share, Copy, Check, Facebook, Twitter, MessageCircle, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { shareVideo, copyToClipboard, generateShareUrls } from '@/services/shareService';
import { toast } from 'sonner';

interface ShareModalProps {
  videoId?: string;
  videoTitle?: string;
  postId?: string;
  postTitle?: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isMoment?: boolean; // Add this prop to identify if it's a moment
  isPost?: boolean; // Add this prop to identify if it's a post
}

const ShareModal: React.FC<ShareModalProps> = ({ 
  videoId, 
  videoTitle, 
  postId, 
  postTitle, 
  children, 
  open, 
  onOpenChange, 
  isMoment = false, 
  isPost = false 
}) => {
  const [copied, setCopied] = useState(false);

  // Generate the appropriate URL based on type
  const getShareUrl = () => {
    if (isPost && postId) {
      return `${window.location.origin}/feed?post=${postId}`;
    } else if (isMoment && videoId) {
      return `${window.location.origin}/moments?start=${videoId}`;
    } else if (videoId) {
      return `${window.location.origin}/video/${videoId}`;
    }
    return window.location.href;
  };

  const shareUrl = getShareUrl();
  const title = isPost ? postTitle : videoTitle;
  const shareUrls = generateShareUrls(shareUrl, title || '');

  const handleNativeShare = async () => {
    const shared = await shareVideo({
      title: title || '',
      url: shareUrl,
      text: isPost ? `Check out this post: ${title}` : `Check out this video: ${title}`,
    });

    if (shared) {
      toast.success('Shared successfully!');
      if (onOpenChange) onOpenChange(false);
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy link');
    }
  };

  const handleSocialShare = (url: string, platform: string) => {
    window.open(url, '_blank', 'width=600,height=400');
    toast.success(`Shared to ${platform}!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share {isPost ? 'Post' : isMoment ? 'Moment' : 'Video'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Native Share Button (for mobile devices) */}
          {navigator.share && (
            <Button onClick={handleNativeShare} className="w-full">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          )}

          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{isPost ? 'Post' : isMoment ? 'Moment' : 'Video'} Link</label>
            <div className="flex space-x-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Social Media Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share on social media</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSocialShare(shareUrls.twitter, 'Twitter')}
                className="justify-start"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSocialShare(shareUrls.facebook, 'Facebook')}
                className="justify-start"
              >
                <Facebook className="w-4 h-4 mr-2" />
                Facebook
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSocialShare(shareUrls.whatsapp, 'WhatsApp')}
                className="justify-start"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSocialShare(shareUrls.telegram, 'Telegram')}
                className="justify-start"
              >
                <Send className="w-4 h-4 mr-2" />
                Telegram
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;