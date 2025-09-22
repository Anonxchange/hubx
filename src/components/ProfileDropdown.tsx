import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, User, Heart, Bell, Upload, List, Rss, MessageCircle, ThumbsUp, Clock, HelpCircle, MessageSquare, Crown, Globe, DollarSign, Video, Users, ChevronDown, BarChart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import SettingsModal from '@/components/SettingsModal';
import { notificationService, type Notification } from '@/services/notificationService';

const ProfileDropdown = () => {
  const { user, userType, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Signed out successfully", description: "You have been logged out." });
      navigate('/auth');
    } catch {
      toast({ title: "Error signing out", description: "Please try again.", variant: "destructive" });
    }
  };

  const getInitials = () => {
    if (!user?.user_metadata) return 'U';
    const firstName = user.user_metadata.first_name || '';
    const lastName = user.user_metadata.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U';
  };

  const getDisplayName = () => {
    if (!user?.user_metadata) return user?.email || 'User';
    const firstName = user.user_metadata.first_name || '';
    const lastName = user.user_metadata.last_name || '';
    return firstName && lastName ? `${firstName} ${lastName}` : user.email || 'User';
  };

  // Load unread notifications count
  useEffect(() => {
    const loadUnreadCount = async () => {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    };

    loadUnreadCount();

    const unsubscribe = notificationService.subscribe({
      onNewNotification: () => setUnreadCount(prev => prev + 1)
    });

    notificationService.startListening();

    return () => {
      unsubscribe();
      notificationService.stopListening();
    };
  }, [user]);

  const isCreator = userType === 'individual_creator' || userType === 'studio_creator';
  const isStudioCreator = userType === 'studio_creator';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center relative">
          <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80 bg-black/95 border-gray-800 text-white p-4 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800" align="start" forceMount>
        {/* Profile Header */}
        <DropdownMenuLabel className="font-normal pb-4">
          <div className="flex flex-col space-y-1">
            <p className="text-lg font-medium leading-none text-white">{getDisplayName()}</p>
            <p className="text-sm leading-none text-gray-400 cursor-pointer hover:text-gray-300" onClick={() => navigate('/profile')}>
              {t('see_profile')}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-gray-700" />

        {/* Icon Grid */}
        <div className="py-4 grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors" onClick={() => navigate('/notifications')}>
            <Bell className="h-6 w-6 text-gray-300" />
            <span className="text-xs text-gray-300">{t('notifications')}</span>
          </div>

          <div className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors" onClick={() => navigate('/inbox')}>
            <MessageCircle className="h-6 w-6 text-gray-300" />
            <span className="text-xs text-gray-300">{t('inbox')}</span>
          </div>

          <div className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors" onClick={() => navigate('/upload')}>
            <Upload className="h-6 w-6 text-gray-300" />
            <span className="text-xs text-gray-300">{t('upload')}</span>
          </div>

          <div className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors" onClick={() => navigate('/favorites')}>
            <Heart className="h-6 w-6 text-gray-300" />
            <span className="text-xs text-gray-300">{t('favorites')}</span>
          </div>

          <div className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors" onClick={() => navigate('/liked')}>
            <ThumbsUp className="h-6 w-6 text-gray-300" />
            <span className="text-xs text-gray-300">{t('liked_videos')}</span>
          </div>

          <div className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors" onClick={() => navigate('/watch-later')}>
            <Clock className="h-6 w-6 text-gray-300" />
            <span className="text-xs text-gray-300">Watch Later</span>
          </div>

          <div className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors" onClick={() => navigate('/playlists')}>
            <List className="h-6 w-6 text-gray-300" />
            <span className="text-xs text-gray-300">Playlists</span>
          </div>

          <div className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-6 w-6 text-gray-300" />
            <span className="text-xs text-gray-300">{t('settings')}</span>
          </div>

          {isCreator && (
            <div className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors" onClick={() => navigate(isStudioCreator ? '/studio-dashboard' : '/creator-dashboard')}>
              <Crown className="h-6 w-6 text-blue-400" />
              <span className="text-xs text-blue-400">{isStudioCreator ? 'Studio Dashboard' : 'Creator Dashboard'}</span>
            </div>
          )}

          {!isCreator && <div className="flex flex-col items-center space-y-2 p-3 rounded-lg" />}
          
          <div className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-red-900/30 cursor-pointer transition-colors border border-red-800/50" onClick={handleSignOut}>
            <LogOut className="h-6 w-6 text-red-400" />
            <span className="text-xs text-red-400">{t('logout')}</span>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-gray-700" />

        {/* Regular Menu Items */}
        <DropdownMenuItem className="cursor-pointer text-white hover:bg-gray-800 focus:bg-gray-800 py-3" onClick={() => navigate('/feed')}>
          <Rss className="mr-3 h-5 w-5 text-gray-300" />
          <span>Feed</span>
        </DropdownMenuItem>

        {isCreator && (
          <>
            <DropdownMenuItem className="cursor-pointer text-white hover:bg-gray-800 focus:bg-gray-800 py-3" onClick={() => navigate('/core-settings')}>
              <Settings className="mr-3 h-5 w-5 text-blue-400" />
              <span>Core Settings</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="cursor-pointer text-white hover:bg-gray-800 focus:bg-gray-800 py-3" onClick={() => navigate('/earnings')}>
              <DollarSign className="mr-3 h-5 w-5 text-green-400" />
              <span>Earnings</span>
            </DropdownMenuItem>

           <DropdownMenuItem className="cursor-pointer text-white hover:bg-gray-800 focus:bg-gray-800 py-3" onClick={() => navigate('/analytics')}>
              <BarChart className="mr-3 h-5 w-5 text-blue-400" />
              <span>Analytics</span>
            </DropdownMenuItem>


            <DropdownMenuItem className="cursor-pointer text-white hover:bg-gray-800 focus:bg-gray-800 py-3" onClick={() => navigate('/content-management')}>
              <Video className="mr-3 h-5 w-5 text-purple-400" />
              <span>Content Management</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="cursor-pointer text-white hover:bg-gray-800 focus:bg-gray-800 py-3" onClick={() => navigate('/contests')}>
              <Crown className="mr-3 h-5 w-5 text-yellow-400" />
              <span>Contests</span>
            </DropdownMenuItem>
          </>
        )}

        {!isCreator && (
          <DropdownMenuItem className="cursor-pointer text-white hover:bg-gray-800 focus:bg-gray-800 py-3" onClick={() => navigate('/become-model')}>
            <Clock className="mr-3 h-5 w-5 text-blue-400 stroke-[3]" />
            <span>Become a Creator</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem className="cursor-pointer text-white hover:bg-gray-800 focus:bg-gray-800 py-3">
          <Globe className="mr-3 h-5 w-5 text-gray-300" />
          <select value={language} onChange={e => setLanguage(e.target.value as any)} className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-blue-500" onClick={e => e.stopPropagation()}>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="it">Italiano</option>
            <option value="pt">Português</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
            <option value="zh">中文</option>
            <option value="ar">العربية</option>
            <option value="ru">Русский</option>
            <option value="hi">हिन्दी</option>
          </select>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer text-white hover:bg-gray-800 focus:bg-gray-800 py-3" onClick={() => navigate('/faq')}>
          <HelpCircle className="mr-3 h-5 w-5 text-gray-300" />
          <span>FAQ</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer text-white hover:bg-gray-800 focus:bg-gray-800 py-3" onClick={() => navigate('/contact')}>
          <MessageSquare className="mr-3 h-5 w-5 text-gray-300" />
          <span>Contact Support</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer text-white hover:bg-gray-800 focus:bg-gray-800 py-3" onClick={() => navigate('/profile')}>
          <User className="mr-3 h-5 w-5 text-gray-300" />
          <span>{t('profile')}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-700" />

        <DropdownMenuItem className="cursor-pointer text-white hover:bg-gray-800 focus:bg-gray-800 py-3" onClick={() => navigate('/featured-videos')}>
          <Video className="mr-3 h-5 w-5 text-blue-400" />
          <span>Featured Videos</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-700" />

        <DropdownMenuItem className="cursor-pointer text-red-400 hover:bg-gray-800 focus:bg-gray-800 py-3" onClick={handleSignOut}>
          <LogOut className="mr-3 h-5 w-5 text-red-400" />
          <span>{t('logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </DropdownMenu>
  );
};

export default ProfileDropdown;