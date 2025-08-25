
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMessaging } from '@/hooks/useMessaging';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, User, Search, MoreHorizontal, Menu, X, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    setSelectedConversation(conversationId);
    await loadMessages(conversationId);
    setSidebarOpen(false); // Close sidebar on mobile when selecting conversation
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !user) {
      console.log('❌ Cannot send message: missing requirements', {
        hasText: !!messageText.trim(),
        hasConversation: !!selectedConversation,
        hasUser: !!user
      });
      return;
    }

    // Find the conversation to get receiver ID
    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) {
      console.error('❌ Conversation not found');
      return;
    }

    const receiverId = conversation.participant_one_id === user.id 
      ? conversation.participant_two_id 
      : conversation.participant_one_id;

    console.log('📤 Sending message...', {
      conversationId: selectedConversation,
      receiverId,
      content: messageText.trim()
    });

    setIsSending(true);
    try {
      const result = await sendMessage({
        conversation_id: selectedConversation,
        receiver_id: receiverId,
        content: messageText.trim()
      });
      
      if (result) {
        console.log('✅ Message sent successfully');
        setMessageText('');
        // Reload messages to show the new message
        await loadMessages(selectedConversation);
      }
    } catch (error) {
      console.error('💥 Failed to send message:', error);
      // You can add toast notification here if needed
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

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery.trim()) return true;
    const participantName = conversation.participant?.full_name || conversation.participant?.username || '';
    const lastMessageContent = conversation.last_message?.content || '';
    return (
      participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lastMessageContent.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Sign in to access messages</h2>
          <p className="text-gray-400">Connect with others through direct messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      <div className="flex h-screen">
        {/* Conversations Sidebar - Mobile Drawer */}
        <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-gray-800 border-r border-gray-700 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-white">Messages</h1>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-700 lg:hidden" onClick={() => setSidebarOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-700 hidden lg:block">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages"
                className="pl-10 bg-gray-700 border-gray-600 rounded-full text-white placeholder-gray-400 focus:bg-gray-600 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-400">Loading conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </div>
            ) : (
              <div>
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation.id)}
                    className={`p-4 cursor-pointer hover:bg-gray-700 border-b border-gray-700 transition-colors ${
                      selectedConversation === conversation.id ? 'bg-gray-700' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarImage 
                          src={conversation.participant?.profile_picture_url || undefined} 
                          alt={conversation.participant?.username || conversation.participant?.full_name || 'User'} 
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {(conversation.participant?.full_name || conversation.participant?.username || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-white truncate">
                            {conversation.participant?.full_name || conversation.participant?.username || 'Unknown User'}
                          </h3>
                          {conversation.last_message && (
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          {conversation.last_message ? (
                            <p className="text-sm text-gray-300 truncate flex-1">
                              {conversation.last_message.content}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No messages</p>
                          )}
                          
                          {conversation.unread_count > 0 && (
                            <div className="ml-2 w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Messages Area - Full Screen */}
        <div className="flex-1 flex flex-col bg-gray-900 lg:ml-0">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-700 lg:hidden" 
                    onClick={() => setSidebarOpen(true)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-700 hidden lg:block" 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                  >
                    <Menu className="w-4 h-4" />
                  </Button>
                  <Avatar className="w-10 h-10">
                    <AvatarImage 
                      src={conversations.find(c => c.id === selectedConversation)?.participant?.profile_picture_url || undefined} 
                      alt="User" 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                      {(conversations.find(c => c.id === selectedConversation)?.participant?.full_name || conversations.find(c => c.id === selectedConversation)?.participant?.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-white">
                      {(() => {
                        const conversation = conversations.find(c => c.id === selectedConversation);
                        return conversation?.participant?.full_name || 
                               conversation?.participant?.username || 
                               'Unknown User';
                      })()}
                    </h2>
                    <p className="text-sm text-gray-400">
                      @{conversations.find(c => c.id === selectedConversation)?.participant?.username || 'user'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
                {currentMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No messages yet</h3>
                    <p className="text-gray-400">Start the conversation with a message below</p>
                  </div>
                ) : (
                  currentMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-sm px-4 py-3 rounded-2xl ${
                          message.sender_id === user.id
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-gray-700 text-white rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === user.id ? 'text-blue-200' : 'text-gray-400'
                        }`}>
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-700 bg-gray-800">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Start a new message"
                      className="rounded-full border-gray-600 bg-gray-700 text-white placeholder-gray-400 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSending}
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || isSending}
                    size="icon"
                    className="rounded-full w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col bg-gray-900">
              {/* Header when no conversation selected */}
              <div className="p-4 border-b border-gray-700 bg-gray-800 lg:hidden">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-700" 
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="w-4 h-4" />
                  </Button>
                  <h1 className="text-lg font-semibold text-white">Messages</h1>
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-sm px-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="w-8 h-8 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">Select a message</h2>
                  <p className="text-gray-400 leading-relaxed mb-6">
                    Choose from your existing conversations, start a new one, or just keep swimming.
                  </p>
                  <Button 
                    onClick={() => setSidebarOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full lg:hidden"
                  >
                    View Conversations
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
