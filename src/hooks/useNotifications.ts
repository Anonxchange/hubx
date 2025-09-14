// hooks/useNotifications.ts
import { useState, useEffect } from 'react';
import { notificationService, type Notification } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      setLoading(true);
      try {
        const data = await notificationService.getNotifications();
        setNotifications(data);
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        console.error('Error loading notifications:', err);
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Subscribe to realtime notifications
    const unsubscribe = notificationService.subscribe({
      onNewNotification: (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast.success(notification.title);
      },
    });

    notificationService.startListening();

    return () => {
      unsubscribe();
      notificationService.stopListening();
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    const success = await notificationService.markAsRead(id);
    if (success) {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const success = await notificationService.markAllAsRead();
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
}