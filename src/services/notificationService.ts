import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Message } from './messagingService';

// Rename to avoid clash with browser Notification
export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'subscribe' | 'upload' | 'view' | 'tip' | 'system' | 'message';
  title: string;
  message: string;
  read: boolean;
  data: any;
  created_at: string;
  updated_at: string;
}

// Alias for compatibility
export type AppNotification = Notification;

export interface NotificationHandler {
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (messageId: string) => void;
  onConversationUpdate?: (conversationId: string) => void;
  onNewNotification?: (notification: AppNotification) => void;
  onNotificationUpdate?: (notification: AppNotification) => void;
  onNotificationDelete?: (notificationId: string) => void;
}

class NotificationService {
  private handlers: NotificationHandler[] = [];
  private subscriptions: any[] = [];
  private listening = false;

  subscribe(handler: NotificationHandler) {
    if (!this.handlers.includes(handler)) {
      this.handlers.push(handler);
    }
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }

  async startListening() {
    if (this.listening) return;
    this.listening = true;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Messages INSERT
    const messageSubscription = supabase
      .channel('messages')
      .on<Message>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          this.handlers.forEach(h => h.onNewMessage?.(payload.new as Message));
        }
      )
      .subscribe();

    // Messages UPDATE (read receipts)
    const messageUpdateSubscription = supabase
      .channel('message_updates')
      .on<Message>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            this.handlers.forEach(h => h.onMessageRead?.((payload.new as Message).id));
          }
        }
      )
      .subscribe();

    // Notifications INSERT / UPDATE / DELETE
    const notificationSubscription = supabase
      .channel('notifications')
      .on<AppNotification>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const notif = payload.new as AppNotification;
            this.handlers.forEach(h => h.onNewNotification?.(notif));

            // Browser popup
            if (typeof window !== 'undefined' && 'Notification' in window) {
              this.showNotification(notif.title, {
                body: notif.message,
                icon: '/favicon.ico',
                tag: notif.id
              });
            }
          }

          if (payload.eventType === 'UPDATE' && payload.new) {
            this.handlers.forEach(h => h.onNotificationUpdate?.(payload.new as AppNotification));
          }

          if (payload.eventType === 'DELETE' && payload.old) {
            this.handlers.forEach(h => h.onNotificationDelete?.((payload.old as AppNotification).id));
          }
        }
      )
      .subscribe();

    this.subscriptions.push(messageSubscription, messageUpdateSubscription, notificationSubscription);
  }

  stopListening() {
    this.subscriptions.forEach(ch => {
      try { ch.unsubscribe?.(); } catch { supabase.removeChannel(ch); }
    });
    this.subscriptions = [];
    this.listening = false;
  }

  async requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (window.Notification.permission === 'default') {
      const permission = await window.Notification.requestPermission();
      return permission === 'granted';
    }
    return window.Notification.permission === 'granted';
  }

  showNotification(title: string, options?: NotificationOptions) {
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification(title, options);
    }
  }

  // --- DB Queries ---

  async getNotifications() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data as AppNotification[];
  }

  async markAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as read:', error);
      return null;
    }

    const notif = data as AppNotification;
    this.handlers.forEach(h => h.onNotificationUpdate?.(notif));
    return notif;
  }

  async markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }

    return true;
  }

  async createNotification(
    userId: string,
    type: AppNotification['type'],
    title: string,
    message: string,
    data: any = {}
  ) {
    const { data: inserted, error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, type, title, message, data })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return inserted as AppNotification;
  }

  // Helpers
  async notifyNewMessage(receiverId: string, senderName: string, messagePreview: string, conversationId: string) {
    return this.createNotification(
      receiverId,
      'message',
      `New message from ${senderName}`,
      messagePreview,
      { conversation_id: conversationId }
    );
  }

  async notifyNewSubscription(userId: string, subscriberName: string, subscriberId: string) {
    return this.createNotification(
      userId,
      'subscribe',
      `${subscriberName} subscribed to you`,
      `${subscriberName} is now subscribed to your content`,
      { subscriber_id: subscriberId }
    );
  }

  async notifyNewLike(userId: string, likerName: string, videoTitle: string, videoId: string) {
    return this.createNotification(
      userId,
      'like',
      `${likerName} liked your video`,
      `${likerName} liked "${videoTitle}"`,
      { video_id: videoId }
    );
  }

  async notifyNewComment(userId: string, commenterName: string, commentText: string, videoId: string) {
    return this.createNotification(
      userId,
      'comment',
      `New comment from ${commenterName}`,
      commentText.substring(0, 100) + (commentText.length > 100 ? '...' : ''),
      { video_id: videoId }
    );
  }

  async getUnreadCount() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  }
}

export const notificationService = new NotificationService();