
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

    // Get conversations where user is a participant
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages!inner (
          id,
          sender_id,
          receiver_id, 
          content,
          created_at,
          read
        )
      `)
      .or(`participant_one_id.eq.${user.id},participant_two_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Process conversations to add participant info and last message
    const processedConversations: Conversation[] = [];
    
    for (const conv of conversations || []) {
      // Get the other participant's profile
      const otherParticipantId = conv.participant_one_id === user.id 
        ? conv.participant_two_id 
        : conv.participant_one_id;

      const { data: participant } = await supabase
        .from('profiles')
        .select('id, username, full_name, profile_picture_url')
        .eq('id', otherParticipantId)
        .single();

      // Get messages for this conversation
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);

      // Count unread messages
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('receiver_id', user.id)
        .eq('read', false);

      processedConversations.push({
        ...conv,
        participant: participant || undefined,
        last_message: messages?.[0] || undefined,
        unread_count: unreadCount || 0
      });
    }

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
