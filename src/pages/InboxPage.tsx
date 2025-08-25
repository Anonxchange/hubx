import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, User, Search, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useMessaging } from '@/hooks/useMessaging';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { Conversation, Message } from '@/services/messagingService';
import { useLocation, useNavigate } from 'react-router-dom';

const InboxPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    conversations,
    currentMessages,
    isLoading,
    currentConversationId,
    loadConversations, // Renamed from loadConversations
    loadMessages,
    sendMessage,
    startConversation, // Added startConversation hook
  } = useMessaging();

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle starting conversation from navigation state
  useEffect(() => {
    const handleStartConversation = async () => {
      if (location.state?.startConversation && user) {
        const { creatorId } = location.state.startConversation;

        if (creatorId && creatorId !== user.id) {
          const conversationId = await startConversation(user.id, creatorId);
          if (conversationId) {
            // Find the conversation in the list and select it
            const conversation = conversations.find(conv => conv.id === conversationId);
            if (conversation) {
              setSelectedConversation(conversation);
              await loadMessages(conversation.id); // Load messages for the newly selected conversation
            }
          }
        }

        // Clear the navigation state
        navigate(location.pathname, { replace: true });
      }
    };

    if (conversations.length > 0) {
      handleStartConversation();
    }
  }, [location.state, user, conversations, startConversation, navigate, location.pathname, loadMessages]); // Added loadMessages dependency

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]); // Added loadConversations dependency

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = conv.participant_one_id === user?.id
      ? conv.participant_two_username
      : conv.participant_one_username;
    return otherParticipant?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
  });

  // Handle conversation selection
  const handleConversationSelect = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await loadMessages(conversation.id);
  };

  // Handle sending message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || !selectedConversation || !user) {
      return;
    }

    const otherParticipantId = selectedConversation.participant_one_id === user.id
      ? selectedConversation.participant_two_id
      : selectedConversation.participant_one_id;

    try {
      await sendMessage({
        conversation_id: selectedConversation.id,
        receiver_id: otherParticipantId,
        content: messageText.trim(),
        message_type: 'text'
      });

      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // Get other participant info
  const getOtherParticipant = (conversation: Conversation) => {
    if (!user) return { username: 'Unknown', id: '' };

    const isParticipantOne = conversation.participant_one_id === user.id;
    return {
      username: isParticipantOne ? conversation.participant_two_username : conversation.participant_one_username,
      id: isParticipantOne ? conversation.participant_two_id : conversation.participant_one_id
    };
  };

  // Mobile conversation list view
  if (isMobile && !selectedConversation) {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        <div className="container mx-auto px-4 py-8 max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <MessageCircle className="w-8 h-8 text-orange-500" />
            <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Conversations List */}
          <div className="space-y-2">
            {filteredConversations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No conversations</h3>
                  <p className="text-muted-foreground">Start messaging with creators to see conversations here.</p>
                </CardContent>
              </Card>
            ) : (
              filteredConversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation);
                return (
                  <Card
                    key={conversation.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => handleConversationSelect(conversation)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground truncate">
                              {otherParticipant.username || 'Unknown User'}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {conversation.last_message_at && formatDistanceToNow(
                                new Date(conversation.last_message_at),
                                { addSuffix: true }
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {typeof conversation.last_message === 'string' ? conversation.last_message : conversation.last_message?.content || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // Mobile conversation view
  if (isMobile && selectedConversation) {
    const otherParticipant = getOtherParticipant(selectedConversation);

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        {/* Chat Header */}
        <div className="border-b bg-card p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedConversation(null)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-foreground">
                {otherParticipant.username || 'Unknown User'}
              </h2>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {currentMessages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      isOwn
                        ? 'bg-orange-500 text-white'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-orange-100' : 'text-muted-foreground'}`}>
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="border-t bg-card p-4">
          <div className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" disabled={!messageText.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Desktop view
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <MessageCircle className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[480px]">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No conversations found</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredConversations.map((conversation) => {
                      const otherParticipant = getOtherParticipant(conversation);
                      const isSelected = selectedConversation?.id === conversation.id;

                      return (
                        <div
                          key={conversation.id}
                          className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                            isSelected ? 'bg-muted' : ''
                          }`}
                          onClick={() => handleConversationSelect(conversation)}
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                <User className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {otherParticipant.username || 'Unknown User'}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {conversation.last_message_at && formatDistanceToNow(
                                    new Date(conversation.last_message_at),
                                    { addSuffix: true }
                                  )}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {typeof conversation.last_message === 'string' ? conversation.last_message : conversation.last_message?.content || 'No messages yet'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">
                      {getOtherParticipant(selectedConversation).username || 'Unknown User'}
                    </CardTitle>
                  </div>
                </CardHeader>

                <Separator />

                {/* Messages */}
                <CardContent className="p-0 flex-1">
                  <ScrollArea className="h-[400px] p-4">
                    <div className="space-y-4">
                      {currentMessages.map((message) => {
                        const isOwn = message.sender_id === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                isOwn
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-muted text-foreground'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className={`text-xs mt-1 ${isOwn ? 'text-orange-100' : 'text-muted-foreground'}`}>
                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>

                <Separator />

                {/* Message Input */}
                <div className="p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!messageText.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No conversation selected</h3>
                  <p className="text-muted-foreground">Choose a conversation to start messaging</p>
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