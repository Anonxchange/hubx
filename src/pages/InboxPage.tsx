import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMessaging } from '@/hooks/useMessaging';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, Search, Edit, ArrowLeft, Info, Plus } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import Header from '@/components/Header';
import VerificationBadge from '@/components/VerificationBadge';

const InboxPage: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const {
    conversations,
    currentMessages,
    isLoading,
    currentConversationId,
    loadMessages,
    sendMessage,
    startConversation
  } = useMessaging();

  // Add local loading state for better UX
  const [localLoading, setLocalLoading] = useState(false);

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups' | '1:1s'>('all');

  // Handle starting a new conversation from profile click
  useEffect(() => {
    const state = location.state as any;
    if (state?.startConversation && user) {
      const { creatorId, creatorName } = state.startConversation;
      handleStartConversation(creatorId, creatorName);
    }
  }, [location.state, user]);

  const handleStartConversation = async (creatorId: string, creatorName: string) => {
    if (!user) return;

    const conversationId = await startConversation(user.id, creatorId);
    if (conversationId) {
      setSelectedConversation(conversationId);
    }
  };

  const handleConversationClick = async (conversationId: string) => {
    setLocalLoading(true);
    setSelectedConversation(conversationId);
    try {
      await loadMessages(conversationId);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !user) return;

    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return;

    const receiverId = conversation.participant_one_id === user.id 
      ? conversation.participant_two_id 
      : conversation.participant_one_id;

    setIsSending(true);
    try {
      const result = await sendMessage({
        conversation_id: selectedConversation,
        receiver_id: receiverId,
        content: messageText.trim()
      });

      if (result) {
        setMessageText('');
        await loadMessages(selectedConversation);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter conversations based on search and active filter
  const filteredConversations = conversations.filter(conversation => {
    // Apply search filter
    if (searchQuery.trim()) {
      const participantName = conversation.participant?.full_name || conversation.participant?.username || '';
      const lastMessageContent = conversation.last_message?.content || '';
      const matchesSearch = participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lastMessageContent.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
    }

    // Apply tab filter
    switch (activeFilter) {
      case 'unread':
        return conversation.unread_count > 0;
      case 'groups':
        return false; // No groups implementation yet
      case '1:1s':
        return true; // All current conversations are 1:1
      default:
        return true;
    }
  });

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, 'h:mm a');
    } else if (diffInHours < 168) { // Less than a week
      return format(date, 'M/d/yy');
    } else {
      return format(date, 'M/d/yy');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign in to access messages</h2>
          <p className="text-gray-400">Connect with others through direct messages</p>
        </div>
      </div>
    );
  }

  if (selectedConversation) {
    const conversation = conversations.find(c => c.id === selectedConversation);
    const participant = conversation?.participant;

    return (
      <div className="min-h-screen bg-gray-950 text-white">
        {/* Conversation Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedConversation(null)}
              className="text-white hover:bg-gray-800"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-8 h-8">
              <AvatarImage 
                src={participant?.profile_picture_url || undefined} 
                alt={participant?.username || 'User'} 
              />
              <AvatarFallback className="bg-gray-600 text-white text-sm">
                {(participant?.full_name || participant?.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-white">
                {participant?.full_name || participant?.username || 'Unknown User'}
              </h2>
              {participant?.username && participant?.username !== participant?.full_name && (
                <VerificationBadge userType="individual_creator" size="small" />
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-gray-800"
            data-testid="button-info"
          >
            <Info className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex flex-col h-[calc(100vh-140px)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <p>No messages yet</p>
                  <p className="text-sm">Send a message to start the conversation</p>
                </div>
              </div>
            ) : (
              <>
                {/* Date separator */}
                <div className="text-center">
                  <span className="text-gray-400 text-sm">
                    {format(new Date(), 'MMM d, yyyy')}
                  </span>
                </div>
                
                {currentMessages.map((message, index) => {
                  const isFromUser = message.sender_id === user.id;
                  const showTime = index === currentMessages.length - 1 || 
                    currentMessages[index + 1]?.sender_id !== message.sender_id;

                  return (
                    <div key={message.id} className={`flex ${isFromUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isFromUser 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-gray-800 text-white'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        {showTime && (
                          <p className={`text-xs mt-1 ${
                            isFromUser ? 'text-purple-100' : 'text-gray-400'
                          }`}>
                            {format(new Date(message.created_at), 'h:mm a')} ✓
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-gray-800"
                data-testid="button-add"
              >
                <Plus className="w-5 h-5" />
              </Button>
              <div className="flex-1 relative">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Write a message"
                  className="bg-gray-800 border-gray-700 rounded-full text-white placeholder-gray-400 pr-12"
                  data-testid="input-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || isSending}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-500 hover:bg-purple-600 rounded-full w-8 h-8 p-0"
                  data-testid="button-send"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex justify-center space-x-8 p-4 border-t border-gray-800">
          <Button variant="ghost" size="icon" className="text-gray-400">
            <div className="w-6 h-6 rounded bg-gray-600"></div>
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400">
            <Search className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400">
            <div className="w-6 h-6 grid grid-cols-2 gap-0.5">
              <div className="bg-gray-600 rounded-sm"></div>
              <div className="bg-gray-600 rounded-sm"></div>
              <div className="bg-gray-600 rounded-sm"></div>
              <div className="bg-gray-600 rounded-sm"></div>
            </div>
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400">
            <div className="w-6 h-6 rounded-sm bg-gray-600"></div>
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400">
            <div className="w-6 h-6 rounded-full bg-gray-600"></div>
          </Button>
          <Button variant="ghost" size="icon" className="text-white">
            <MessageCircle className="w-6 h-6" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-950 text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <button className="text-white">
            <div className="flex flex-col gap-1">
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
          </button>
          <h1 className="text-xl font-semibold">Direct Casts</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-gray-800"
          data-testid="button-compose"
        >
          <Edit className="w-5 h-5" />
        </Button>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="pl-10 bg-gray-900 border-gray-700 rounded-full text-white placeholder-gray-400"
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex px-4 pb-4 gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: 'Unread' },
          { key: 'groups', label: 'Groups' },
          { key: '1:1s', label: '1:1s' }
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeFilter === tab.key ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter(tab.key as any)}
            className={`rounded-full px-4 py-2 text-sm ${
              activeFilter === tab.key 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            data-testid={`tab-${tab.key}`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Conversations List */}
      <div className="flex-1">
        {isLoading ? (
          <div className="p-4 text-center text-gray-400">Loading conversations...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <div>
            {filteredConversations.map((conversation) => {
              const participant = conversation.participant;
              const lastMessage = conversation.last_message;
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation.id)}
                  className="flex items-center p-4 hover:bg-gray-900 cursor-pointer"
                  data-testid={`conversation-${conversation.id}`}
                >
                  <Avatar className="w-12 h-12 mr-3">
                    <AvatarImage 
                      src={participant?.profile_picture_url || undefined} 
                      alt={participant?.username || 'User'} 
                    />
                    <AvatarFallback className="bg-gray-600 text-white">
                      {(participant?.full_name || participant?.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white truncate">
                          {participant?.full_name || participant?.username || 'Unknown User'}
                        </h3>
                        {participant?.username && (
                          <VerificationBadge userType="individual_creator" size="small" />
                        )}
                      </div>
                      {lastMessage && (
                        <span className="text-gray-400 text-sm flex-shrink-0">
                          {formatMessageTime(lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {lastMessage ? (
                        <p className="text-gray-400 text-sm truncate">
                          {lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-gray-500 text-sm italic">No messages</p>
                      )}
                      
                      {conversation.unread_count > 0 && (
                        <div className="w-2 h-2 bg-purple-400 rounded-full ml-2 flex-shrink-0"></div>
                      )}
                    </div>
                  </div>

                  <div className="ml-3">
                    <div className="w-5 h-5 text-gray-600">✓</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-center space-x-8 p-4 border-t border-gray-800">
        <Button variant="ghost" size="icon" className="text-gray-400">
          <div className="w-6 h-6 rounded bg-gray-600"></div>
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400">
          <Search className="w-6 h-6" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400">
          <div className="w-6 h-6 grid grid-cols-2 gap-0.5">
            <div className="bg-gray-600 rounded-sm"></div>
            <div className="bg-gray-600 rounded-sm"></div>
            <div className="bg-gray-600 rounded-sm"></div>
            <div className="bg-gray-600 rounded-sm"></div>
          </div>
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400">
          <div className="w-6 h-6 rounded-sm bg-gray-600"></div>
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400">
          <div className="w-6 h-6 rounded-full bg-gray-600"></div>
        </Button>
        <Button variant="ghost" size="icon" className="text-white">
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    </div>
    </>
  );
};

export default InboxPage;