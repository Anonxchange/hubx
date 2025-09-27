
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

// Get user's conversations with limit
export const getUserConversations = async (): Promise<Conversation[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get conversations where user is a participant (limit to recent 20 for faster loading)
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_one_id.eq.${user.id},participant_two_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    if (!conversations || conversations.length === 0) return [];

    // Get all participant IDs in one go
    const participantIds = new Set<string>();
    conversations.forEach(conv => {
      const otherParticipantId = conv.participant_one_id === user.id 
        ? conv.participant_two_id 
        : conv.participant_one_id;
      participantIds.add(otherParticipantId);
    });

    // Batch fetch all participants
    const { data: participants } = await supabase
      .from('profiles')
      .select('id, username, full_name, profile_picture_url')
      .in('id', Array.from(participantIds));

    const participantsMap = new Map(
      (participants || []).map(p => [p.id, p])
    );

    // Batch fetch last messages for all conversations
    const conversationIds = conversations.map(c => c.id);
    const { data: allMessages } = await supabase
      .from('messages')
      .select('conversation_id, content, created_at, sender_id')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });

    // Group messages by conversation and get the latest for each
    const lastMessagesMap = new Map<string, any>();
    (allMessages || []).forEach(message => {
      if (!lastMessagesMap.has(message.conversation_id)) {
        lastMessagesMap.set(message.conversation_id, message);
      }
    });

    // Batch fetch unread counts
    const { data: unreadCounts } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', conversationIds)
      .eq('receiver_id', user.id)
      .eq('read', false);

    const unreadCountsMap = new Map<string, number>();
    (unreadCounts || []).forEach(msg => {
      const count = unreadCountsMap.get(msg.conversation_id) || 0;
      unreadCountsMap.set(msg.conversation_id, count + 1);
    });

    // Process conversations with batched data
    const processedConversations: Conversation[] = conversations.map(conv => {
      const otherParticipantId = conv.participant_one_id === user.id 
        ? conv.participant_two_id 
        : conv.participant_one_id;

      return {
        ...conv,
        participant: participantsMap.get(otherParticipantId) || undefined,
        last_message: lastMessagesMap.get(conv.id) || undefined,
        unread_count: unreadCountsMap.get(conv.id) || 0
      };
    });

    return processedConversations;
  } catch (error) {
    console.error('Error getting conversations:', error);
    return [];
  }
};

// Get messages for a conversation with limit
export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(100); // Limit to recent 100 messages

    if (error) throw error;
    return (messages || []).reverse(); // Reverse to maintain chronological order
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
