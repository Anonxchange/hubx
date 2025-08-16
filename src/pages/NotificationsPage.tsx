
import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Heart, MessageCircle, UserPlus, Video, Eye, DollarSign, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'upload' | 'view' | 'tip' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  user?: {
    username: string;
    avatar_url: string;
  };
  post_id?: string;
  video_id?: string;
}

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock notifications data
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'like',
        title: 'New Like',
        message: 'Sarah liked your post',
        read: false,
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        user: {
          username: 'sarah_model',
          avatar_url: '/placeholder.svg'
        },
        post_id: 'post-1'
      },
      {
        id: '2',
        type: 'comment',
        title: 'New Comment',
        message: 'Mike commented on your video: "Amazing content!"',
        read: false,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        user: {
          username: 'mike_fan',
          avatar_url: '/placeholder.svg'
        },
        video_id: 'video-1'
      },
      {
        id: '3',
        type: 'follow',
        title: 'New Follower',
        message: 'Emma started following you',
        read: true,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        user: {
          username: 'emma_lover',
          avatar_url: '/placeholder.svg'
        }
      },
      {
        id: '4',
        type: 'tip',
        title: 'New Tip',
        message: 'You received a $25 tip from Alex',
        read: false,
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        user: {
          username: 'alex_supporter',
          avatar_url: '/placeholder.svg'
        }
      },
      {
        id: '5',
        type: 'system',
        title: 'Weekly Earnings Report',
        message: 'Your weekly earnings report is ready to view',
        read: true,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    setNotifications(mockNotifications);
    setLoading(false);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'upload':
        return <Video className="w-5 h-5 text-purple-500" />;
      case 'view':
        return <Eye className="w-5 h-5 text-orange-500" />;
      case 'tip':
        return <DollarSign className="w-5 h-5 text-yellow-500" />;
      case 'system':
        return <Settings className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'unread') return !notif.read;
    if (activeTab === 'interactions') return ['like', 'comment', 'follow'].includes(notif.type);
    if (activeTab === 'earnings') return ['tip', 'system'].includes(notif.type);
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Bell className="w-8 h-8 text-orange-500" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-red-500 text-white">
                  {unreadCount}
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-2">
              Stay updated with your latest interactions and earnings
            </p>
          </div>
          
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4 bg-card">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No notifications</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'unread' ? "You're all caught up!" : "No notifications in this category."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !notification.read ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* Notification Icon */}
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* User Avatar (if applicable) */}
                    {notification.user && (
                      <div className="flex-shrink-0">
                        <img
                          src={notification.user.avatar_url}
                          alt={notification.user.username}
                          className="w-8 h-8 rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                    )}

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-foreground">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default NotificationsPage;
