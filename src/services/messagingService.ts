
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  media_url?: string;
  created_at: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participant_one_id: string;
  participant_two_id: string;
  created_at: string;
  updated_at: string;
  participant?: {
    id: string;
    username: string;
    full_name: string;
    profile_picture_url: string;
  };
  last_message?: Message;
  unread_count: number;
}

export interface CreateMessageData {
  conversation_id: string;
  receiver_id: string;
  content: string;
  media_url?: string;
}

// Get or create conversation between two users
export const getOrCreateConversation = async (participantOneId: string, participantTwoId: string): Promise<string | null> => {
  try {
    // Try to find existing conversation (in either direction)
    const { data: existingConversation, error: searchError } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_one_id.eq.${participantOneId},participant_two_id.eq.${participantTwoId}),and(participant_one_id.eq.${participantTwoId},participant_two_id.eq.${participantOneId})`)
      .single();

    if (existingConversation && !searchError) {
      return existingConversation.id;
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        participant_one_id: participantOneId,
        participant_two_id: participantTwoId
      })
      .select('id')
      .single();

    if (createError) throw createError;
    return newConversation?.id || null;
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    return null;
  }
};

// Send a message
export const sendMessage = async (messageData: CreateMessageData): Promise<Message | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: messageData.conversation_id,
        sender_id: user.id,
        receiver_id: messageData.receiver_id,
        content: messageData.content,
        media_url: messageData.media_url
      })
      .select()
      .single();

    if (error) throw error;
    return message;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
};

// Get user's conversations
export const getUserConversations = async (): Promise<Conversation[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get conversations with participant profiles in a single query
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant_one:profiles!conversations_participant_one_id_fkey(id, username, full_name, profile_picture_url),
        participant_two:profiles!conversations_participant_two_id_fkey(id, username, full_name, profile_picture_url)
      `)
      .or(`participant_one_id.eq.${user.id},participant_two_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Get all conversation IDs for batch queries
    const conversationIds = (conversations || []).map(c => c.id);
    
    if (conversationIds.length === 0) return [];

    // Batch get last messages
    const { data: lastMessages } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });

    // Batch get unread counts
    const { data: unreadMessages } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', conversationIds)
      .eq('receiver_id', user.id)
      .eq('read', false);

    // Create lookup maps
    const lastMessageMap = new Map();
    const unreadCountMap = new Map();

    // Process last messages
    lastMessages?.forEach(msg => {
      if (!lastMessageMap.has(msg.conversation_id)) {
        lastMessageMap.set(msg.conversation_id, msg);
      }
    });

    // Process unread counts
    unreadMessages?.forEach(msg => {
      const count = unreadCountMap.get(msg.conversation_id) || 0;
      unreadCountMap.set(msg.conversation_id, count + 1);
    });

    // Process conversations
    const processedConversations: Conversation[] = (conversations || []).map(conv => {
      const participant = conv.participant_one_id === user.id 
        ? conv.participant_two 
        : conv.participant_one;

      return {
        ...conv,
        participant: participant || undefined,
        last_message: lastMessageMap.get(conv.id) || undefined,
        unread_count: unreadCountMap.get(conv.id) || 0
      };
    });

    return processedConversations;
  } catch (error) {
    console.error('Error getting conversations:', error);
    return [];
  }
};

// Get messages for a conversation
export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return messages || [];
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    return [];
  }
};

// Mark messages as read
export const markMessagesAsRead = async (conversationId: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', user.id)
      .eq('read', false);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};
