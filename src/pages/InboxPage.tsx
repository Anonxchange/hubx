
import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Search, MoreVertical, Phone, Video, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  media_url?: string;
}

interface Conversation {
  id: string;
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    is_online: boolean;
  };
  last_message: Message;
  unread_count: number;
  messages: Message[];
}

const InboxPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock conversations data
    const mockConversations: Conversation[] = [
      {
        id: '1',
        user: {
          id: 'user-1',
          username: 'sarah_model',
          full_name: 'Sarah Johnson',
          avatar_url: '/placeholder.svg',
          is_online: true
        },
        last_message: {
          id: 'msg-1',
          sender_id: 'user-1',
          receiver_id: user?.id || '',
          content: 'Hey! Thanks for subscribing to my content! 💕',
          created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          read: false
        },
        unread_count: 2,
        messages: [
          {
            id: 'msg-1',
            sender_id: 'user-1',
            receiver_id: user?.id || '',
            content: 'Hey! Thanks for subscribing to my content! 💕',
            created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            read: false
          },
          {
            id: 'msg-2',
            sender_id: 'user-1',
            receiver_id: user?.id || '',
            content: 'Hope you enjoy what I have in store for you! 😘',
            created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            read: false
          }
        ]
      },
      {
        id: '2',
        user: {
          id: 'user-2',
          username: 'mike_creator',
          full_name: 'Mike Anderson',
          avatar_url: '/placeholder.svg',
          is_online: false
        },
        last_message: {
          id: 'msg-3',
          sender_id: user?.id || '',
          receiver_id: 'user-2',
          content: 'Thanks for the great content!',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: true
        },
        unread_count: 0,
        messages: [
          {
            id: 'msg-3',
            sender_id: user?.id || '',
            receiver_id: 'user-2',
            content: 'Thanks for the great content!',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            read: true
          }
        ]
      }
    ];
    
    setConversations(mockConversations);
    setLoading(false);

    // Handle starting a new conversation from MessageButton
    const startConversation = location.state?.startConversation;
    if (startConversation) {
      const existingConversation = mockConversations.find(
        conv => conv.user.id === startConversation.creatorId
      );
      
      if (existingConversation) {
        setSelectedConversation(existingConversation);
      } else {
        // Create a new conversation
        const newConversation: Conversation = {
          id: `new-${Date.now()}`,
          user: {
            id: startConversation.creatorId,
            username: startConversation.creatorName.toLowerCase().replace(' ', '_'),
            full_name: startConversation.creatorName,
            avatar_url: '/placeholder.svg',
            is_online: false
          },
          last_message: {
            id: '',
            sender_id: '',
            receiver_id: '',
            content: 'Start a conversation...',
            created_at: new Date().toISOString(),
            read: true
          },
          unread_count: 0,
          messages: []
        };
        
        setConversations(prev => [newConversation, ...prev]);
        setSelectedConversation(newConversation);
      }
    }
  }, [user, location.state]);

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      sender_id: user?.id || '',
      receiver_id: selectedConversation.user.id,
      content: newMessage,
      created_at: new Date().toISOString(),
      read: false
    };

    setConversations(prev =>
      prev.map(conv =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              messages: [...conv.messages, message],
              last_message: message
            }
          : conv
      )
    );

    setSelectedConversation(prev =>
      prev ? {
        ...prev,
        messages: [...prev.messages, message],
        last_message: message
      } : null
    );

    setNewMessage('');
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-96 bg-muted rounded"></div>
              <div className="lg:col-span-2 h-96 bg-muted rounded"></div>
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
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-orange-500" />
              Inbox
              {totalUnread > 0 && (
                <Badge variant="secondary" className="bg-red-500 text-white">
                  {totalUnread}
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-2">
              Connect with your fans and other creators
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-y-auto h-[500px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No conversations found</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer transition-colors border-b border-border hover:bg-muted/50 ${
                        selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={conversation.user.avatar_url}
                            alt={conversation.user.username}
                            className="w-12 h-12 rounded-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder.svg';
                            }}
                          />
                          {conversation.user.is_online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-foreground truncate">
                              {conversation.user.full_name}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground truncate">
                              {conversation.last_message.content}
                            </p>
                            {conversation.unread_count > 0 && (
                              <Badge variant="secondary" className="bg-blue-500 text-white text-xs">
                                {conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 overflow-hidden">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={selectedConversation.user.avatar_url}
                          alt={selectedConversation.user.username}
                          className="w-10 h-10 rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.svg';
                          }}
                        />
                        {selectedConversation.user.is_online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {selectedConversation.user.full_name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          @{selectedConversation.user.username}
                          {selectedConversation.user.is_online && (
                            <span className="ml-2 text-green-500">● Online</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Video className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Info className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="p-0 flex flex-col h-[440px]">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    {selectedConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            message.sender_id === user?.id
                              ? 'bg-orange-500 text-white'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_id === user?.id ? 'text-orange-100' : 'text-muted-foreground'
                          }`}>
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-border">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="resize-none"
                        rows={2}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="self-end"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default InboxPage;
