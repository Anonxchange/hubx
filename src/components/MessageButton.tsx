import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface MessageButtonProps {
  creatorId: string;
  creatorName: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const MessageButton: React.FC<MessageButtonProps> = ({
  creatorId,
  creatorName,
  variant = 'outline',
  size = 'default',
  className = ''
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleMessage = () => {
    if (!user) {
      toast.error("Please sign in to send messages");
      navigate('/auth');
      return;
    }

    // Check if user is trying to message themselves
    if (user.id === creatorId) {
      toast.error("Cannot message yourself");
      return;
    }

    // Navigate to inbox with the conversation
    navigate('/inbox', {
      state: {
        startConversation: {
          creatorId,
          creatorName
        }
      }
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleMessage();
      }}
      className={`flex items-center gap-2 ${className}`}
      type="button"
    >
      <MessageCircle className="w-4 h-4" />
      <span>Message</span>
    </Button>
  );
};

export default MessageButton;