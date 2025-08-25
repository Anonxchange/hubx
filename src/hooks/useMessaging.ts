
import { useState, useEffect } from 'react';
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  getOrCreateConversation,
  type Conversation,
  type Message,
  type CreateMessageData
} from '@/services/messagingService';
import { notificationService } from '@/services/notificationService';
import { toast } from 'sonner';

export const useMessaging = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Load conversations
  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const data = await getUserConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId: string) => {
    setIsLoading(true);
    try {
      const messages = await getConversationMessages(conversationId);
      setCurrentMessages(messages);
      setCurrentConversationId(conversationId);
      
      // Mark messages as read
      await markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  // Send a message
  const handleSendMessage = async (messageData: CreateMessageData) => {
    try {
      const newMessage = await sendMessage(messageData);
      if (newMessage && currentConversationId === messageData.conversation_id) {
        setCurrentMessages(prev => [...prev, newMessage]);
      }
      
      // Create notification for the receiver
      if (newMessage && messageData.receiver_id) {
        await notificationService.createNotification(
          messageData.receiver_id,
          'message',
          'New Message',
          `You received a new message: ${messageData.content.substring(0, 50)}${messageData.content.length > 50 ? '...' : ''}`,
          { message_id: newMessage.id, conversation_id: messageData.conversation_id }
        );
      }
      
      // Refresh conversations to update last message
      await loadConversations();
      
      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return null;
    }
  };

  // Start or open conversation with a user
  const startConversation = async (participantOneId: string, participantTwoId: string) => {
    try {
      const conversationId = await getOrCreateConversation(participantOneId, participantTwoId);
      if (conversationId) {
        await loadMessages(conversationId);
        await loadConversations();
      }
      return conversationId;
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
      return null;
    }
  };

  // Setup real-time notifications
  useEffect(() => {
    const unsubscribe = notificationService.subscribe({
      onNewMessage: (message) => {
        // Add message to current conversation if it matches
        if (currentConversationId === message.conversation_id) {
          setCurrentMessages(prev => [...prev, message]);
        }
        
        // Show notification
        notificationService.showNotification('New Message', {
          body: message.content,
          icon: '/favicon.ico'
        });
        
        // Refresh conversations
        loadConversations();
      },
      onMessageRead: () => {
        loadConversations();
      }
    });

    notificationService.startListening();
    notificationService.requestNotificationPermission();

    return () => {
      unsubscribe();
      notificationService.stopListening();
    };
  }, [currentConversationId]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  return {
    conversations,
    currentMessages,
    isLoading,
    currentConversationId,
    loadConversations,
    loadMessages,
    sendMessage: handleSendMessage,
    startConversation
  };
};
