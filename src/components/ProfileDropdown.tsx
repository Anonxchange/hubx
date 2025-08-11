import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, User, Heart, Bell, Upload, List, Rss, MessageCircle, ThumbsUp, Clock, HelpCircle, MessageSquare, Crown, Globe } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

const ProfileDropdown = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out.",
      });
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
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

  // Check if the current user is a creator
  const isCreator = user?.user_metadata?.user_type === 'creator';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center">
          <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
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

        {/* Icon Grid Section */}
        <div className="py-4">
          <div className="grid grid-cols-3 gap-4">
            {/* First Row */}
            <div
              className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="h-6 w-6 text-gray-300" />
              <span className="text-xs text-gray-300">{t('notifications')}</span>
            </div>

            <div
              className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => navigate('/inbox')}
            >
              <MessageCircle className="h-6 w-6 text-gray-300" />
              <span className="text-xs text-gray-300">{t('inbox')}</span>
            </div>

            <div
              className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => navigate('/upload')}
            >
              <Upload className="h-6 w-6 text-gray-300" />
              <span className="text-xs text-gray-300">{t('upload')}</span>
            </div>

            {/* Second Row */}
            <div
              className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => navigate('/favorites')}
            >
              <Heart className="h-6 w-6 text-gray-300" />
              <span className="text-xs text-gray-300">{t('favorites')}</span>
            </div>

            <div
              className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => navigate('/liked')}
            >
              <ThumbsUp className="h-6 w-6 text-gray-300" />
              <span className="text-xs text-gray-300">{t('liked_videos')}</span>
            </div>

            <div className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
              <List className="h-6 w-6 text-gray-300" />
              <span className="text-xs text-gray-300">Playlists</span>
            </div>

            {/* Third Row */}
            <div className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
              <Settings className="h-6 w-6 text-gray-300" />
              <span className="text-xs text-gray-300">{t('settings')}</span>
            </div>

            {isCreator && (
              <div
                className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => navigate('/creator-dashboard')}
              >
                <Crown className="h-6 w-6 text-blue-400" />
                <span className="text-xs text-blue-400">Creator Dashboard</span>
              </div>
            )}

            <div
              className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-red-900/30 cursor-pointer transition-colors border border-red-800/50"
              onClick={handleSignOut}
            >
              <LogOut className="h-6 w-6 text-red-400" />
              <span className="text-xs text-red-400">{t('logout')}</span>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-gray-700" />

        {/* Menu Items */}
        <div className="py-2">
          <DropdownMenuItem
            className="cursor-pointer text-white hover:bg-gray-800 focus:bg-gray-800 py-3"
            onClick={() => navigate('/feed')}
          >
            <Rss className="mr-3 h-5 w-5 text-gray-300" />
            <span>Feed</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-white hover:bg-gray-800 focus:bg-gray-800 py-3"
            onClick={() => navigate('/become-model')}
          >
            <div className="flex items-center">
              <Clock className="mr-3 h-5 w-5 text-blue-400 stroke-[3]" />
              <span>Become a Creator</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer text-white hover:bg-gray-800 focus:bg-gray-800 py-3">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <Globe className="mr-3 h-5 w-5 text-gray-300" />
                <span>{t('language')}</span>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-blue-500"
                onClick={(e) => e.stopPropagation()}
              >
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
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-white hover:bg-gray-800 focus:bg-gray-800 py-3"
            onClick={() => navigate('/faq')}
          >
            <HelpCircle className="mr-3 h-5 w-5 text-gray-300" />
            <span>FAQ</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-white hover:bg-gray-800 focus:bg-gray-800 py-3"
            onClick={() => navigate('/contact')}
          >
            <MessageSquare className="mr-3 h-5 w-5 text-gray-300" />
            <span>Contact Support</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-white hover:bg-gray-800 focus:bg-gray-800 py-3"
            onClick={() => navigate('/profile')}
          >
            <User className="mr-3 h-5 w-5 text-gray-300" />
            <span>{t('profile')}</span>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="bg-gray-700" />

        <DropdownMenuItem
          className="cursor-pointer text-red-400 hover:bg-gray-800 focus:bg-gray-800 py-3"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-5 w-5 text-red-400" />
          <span>{t('logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;