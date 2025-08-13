
import React, { useState, useEffect } from 'react';
import { Search, Users, Play, Eye, TrendingUp, Star, Crown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdComponent from '@/components/AdComponent';

interface Channel {
  id: string;
  name: string;
  avatar: string;
  subscribers: string;
  videos: string;
  views: string;
  rank: number;
  verified: boolean;
  description?: string;
  category?: string;
}

const ChannelPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);

  // Mock channel data - replace with actual API call
  useEffect(() => {
    const mockChannels: Channel[] = [
      {
        id: '1',
        name: 'HotStudio',
        avatar: '/placeholder.svg',
        subscribers: '8.2M',
        videos: '4.4K',
        views: '9.8B',
        rank: 1,
        verified: true,
        description: 'Premium adult content studio',
        category: 'Studio'
      },
      {
        id: '2',
        name: 'Bella Rose',
        avatar: '/placeholder.svg',
        subscribers: '3.2M',
        videos: '6.9K',
        views: '6.1B',
        rank: 16,
        verified: true,
        description: 'Independent content creator',
        category: 'Individual'
      },
      {
        id: '3',
        name: 'Fantasy Network',
        avatar: '/placeholder.svg',
        subscribers: '339K',
        videos: '3.1K',
        views: '575M',
        rank: 66,
        verified: false,
        description: 'Amateur content network',
        category: 'Network'
      },
      {
        id: '4',
        name: 'Luna Star',
        avatar: '/placeholder.svg',
        subscribers: '2.8M',
        videos: '892',
        views: '4.2B',
        rank: 8,
        verified: true,
        description: 'Latina pornstar',
        category: 'Individual'
      },
      {
        id: '5',
        name: 'Premium Productions',
        avatar: '/placeholder.svg',
        subscribers: '1.5M',
        videos: '2.3K',
        views: '2.8B',
        rank: 32,
        verified: true,
        description: 'High quality adult films',
        category: 'Studio'
      },
      {
        id: '6',
        name: 'Amateur Central',
        avatar: '/placeholder.svg',
        subscribers: '945K',
        videos: '5.7K',
        views: '1.2B',
        rank: 45,
        verified: false,
        description: 'Real amateur couples',
        category: 'Amateur'
      }
    ];
    
    setChannels(mockChannels);
    setFilteredChannels(mockChannels);
  }, []);

  // Filter channels based on search and active tab
  useEffect(() => {
    let filtered = channels;

    if (searchQuery.trim()) {
      filtered = filtered.filter(channel =>
        channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        channel.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeTab === 'popular') {
      filtered = filtered.sort((a, b) => parseInt(a.subscribers.replace(/[^0-9]/g, '')) - parseInt(b.subscribers.replace(/[^0-9]/g, ''))).reverse();
    } else if (activeTab === 'trending') {
      filtered = filtered.sort((a, b) => parseInt(a.views.replace(/[^0-9]/g, '')) - parseInt(b.views.replace(/[^0-9]/g, ''))).reverse();
    } else {
      filtered = filtered.sort((a, b) => a.rank - b.rank);
    }

    setFilteredChannels(filtered);
  }, [searchQuery, activeTab, channels]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const tabs = [
    { id: 'all', label: 'All Channels', icon: Users },
    { id: 'popular', label: 'Most Popular', icon: Star },
    { id: 'trending', label: 'Trending', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Ad Component at the top */}
        <div className="mb-8">
          <AdComponent zoneId="5660534" />
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Browse All Channels</h1>
          <p className="text-gray-400">Discover your favorite content creators and studios</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearchSubmit} className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search Channels"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border-gray-600 text-white placeholder-gray-400 pl-12 pr-4 py-3 rounded-lg"
            />
          </form>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600'
                      : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Channel Grid */}
        <div className="space-y-4">
          {filteredChannels.map((channel) => (
            <Card key={channel.id} className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    <div className="text-gray-400 text-sm font-medium mb-1">Rank</div>
                    <div className="text-white text-lg font-bold">{channel.rank}</div>
                  </div>

                  {/* Channel Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={channel.avatar}
                        alt={channel.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                  </div>

                  {/* Channel Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-orange-400 hover:text-orange-300 transition-colors">
                        {channel.name}
                      </h3>
                      {channel.verified && (
                        <Crown className="w-5 h-5 text-yellow-500" title="Verified Channel" />
                      )}
                      {channel.category && (
                        <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                          {channel.category}
                        </Badge>
                      )}
                    </div>

                    {channel.description && (
                      <p className="text-gray-400 text-sm mb-3">{channel.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Subscribers</div>
                        <div className="text-white font-semibold text-lg">{channel.subscribers}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Videos</div>
                        <div className="text-white font-semibold text-lg">{channel.videos}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Video Views</div>
                        <div className="text-white font-semibold text-lg">{channel.views}</div>
                      </div>
                    </div>
                  </div>

                  {/* Subscribe Button */}
                  <div className="flex-shrink-0 flex flex-col items-end space-y-3">
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 rounded-full">
                      <Users className="w-4 h-4 mr-2" />
                      Subscribe
                    </Button>
                    
                    {/* Trophy icon for top channels */}
                    {channel.rank <= 10 && (
                      <div className="text-yellow-500">
                        <Star className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 px-8 py-3"
          >
            Load More Channels
          </Button>
        </div>

        {/* Another Ad at the bottom */}
        <div className="mt-12">
          <AdComponent zoneId="5660534" />
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ChannelPage;
