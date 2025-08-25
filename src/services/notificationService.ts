
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Message } from './messagingService';

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'upload' | 'view' | 'tip' | 'system' | 'message';
  title: string;
  message: string;
  read: boolean;
  data: any;
  created_at: string;
  updated_at: string;
}

export interface NotificationHandler {
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (messageId: string) => void;
  onConversationUpdate?: (conversationId: string) => void;
  onNewNotification?: (notification: Notification) => void;
}

class NotificationService {
  private handlers: NotificationHandler[] = [];
  private subscriptions: any[] = [];

  subscribe(handler: NotificationHandler) {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }

  async startListening() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Listen for new messages
    const messageSubscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          this.handlers.forEach(handler => {
            if (handler.onNewMessage && payload.new) {
              handler.onNewMessage(payload.new as Message);
            }
          });
        }
      )
      .subscribe();

    // Listen for message read updates
    const messageUpdateSubscription = supabase
      .channel('message_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          this.handlers.forEach(handler => {
            if (handler.onMessageRead && payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
              handler.onMessageRead(payload.new.id);
            }
          });
        }
      )
      .subscribe();

    // Listen for new notifications
    const notificationSubscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload: RealtimePostgresChangesPayload<Notification>) => {
          this.handlers.forEach(handler => {
            if (handler.onNewNotification && payload.new) {
              const notification = payload.new as Notification;
              handler.onNewNotification(notification);
              
              // Show browser notification if supported
              if (typeof window !== 'undefined' && 'Notification' in window) {
                this.showNotification(notification.title, {
                  body: notification.message,
                  icon: '/favicon.ico',
                  tag: notification.id
                });
              }
            }
          });
        }
      )
      .subscribe();

    this.subscriptions.push(messageSubscription, messageUpdateSubscription, notificationSubscription);
  }

  stopListening() {
    this.subscriptions.forEach(subscription => {
      supabase.removeChannel(subscription);
    });
    this.subscriptions = [];
  }

  async requestNotificationPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default') {
      const permission = await window.Notification.requestPermission();
      return permission === 'granted';
    }
    return typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted';
  }

  showNotification(title: string, options?: NotificationOptions) {
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification(title, options);
    }
  }

  // Get notifications for current user
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

    return data as Notification[];
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  }

  // Mark all notifications as read
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

  // Create a new notification
  async createNotification(userId: string, type: string, title: string, message: string, data: any = {}) {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data
      });

    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }

    return true;
  }

  // Helper methods for common notification types
  async notifyNewMessage(receiverId: string, senderName: string, messagePreview: string, conversationId: string) {
    return this.createNotification(
      receiverId,
      'message',
      `New message from ${senderName}`,
      messagePreview,
      { conversation_id: conversationId }
    );
  }

  async notifyNewFollow(userId: string, followerName: string, followerId: string) {
    return this.createNotification(
      userId,
      'follow',
      `${followerName} started following you`,
      `${followerName} is now following your content`,
      { follower_id: followerId }
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

  // Get unread count
  async getUnreadCount() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
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
