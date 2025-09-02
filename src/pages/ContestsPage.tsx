import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Crown, Calendar, Users, DollarSign, Star, Gift, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';

const ContestsPage = () => {
  const navigate = useNavigate();
  const { user, userType } = useAuth();

  // Mock contest data - replace with actual data from Supabase
  const [activeContests] = useState([
    {
      id: '1',
      title: 'Top Creator January 2024',
      description: 'Compete for the highest engagement this month',
      prize: '$5,000',
      endDate: '2024-01-31',
      participants: 127,
      myRank: 15,
      category: 'engagement',
      status: 'active',
      progress: 65,
      requirement: 'Most likes + comments combined',
      timeLeft: '5 days remaining'
    },
    {
      id: '2',
      title: 'Best New Creator',
      description: 'For creators who joined in the last 3 months',
      prize: '$2,000',
      endDate: '2024-02-15',
      participants: 89,
      myRank: 8,
      category: 'newcomer',
      status: 'active',
      progress: 45,
      requirement: 'Growth rate and quality content',
      timeLeft: '3 weeks remaining'
    },
    {
      id: '3',
      title: 'Quality Content Challenge',
      description: 'Upload your best premium content',
      prize: '$3,000',
      endDate: '2024-01-25',
      participants: 203,
      myRank: null,
      category: 'content',
      status: 'registration',
      progress: 0,
      requirement: 'Quality score from community votes',
      timeLeft: 'Registration open'
    }
  ]);

  const [completedContests] = useState([
    {
      id: '4',
      title: 'December Top Earner',
      description: 'Highest earnings in December 2023',
      prize: '$4,000',
      endDate: '2023-12-31',
      participants: 156,
      myRank: 23,
      category: 'earnings',
      status: 'completed',
      winner: 'Creator_Sarah123'
    }
  ]);

  const stats = {
    contestsJoined: 3,
    currentRank: 15,
    prizesWon: '$500',
    totalParticipants: activeContests.reduce((sum, contest) => sum + contest.participants, 0)
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'engagement': return <Star className="w-4 h-4" />;
      case 'newcomer': return <Gift className="w-4 h-4" />;
      case 'content': return <Target className="w-4 h-4" />;
      case 'earnings': return <DollarSign className="w-4 h-4" />;
      default: return <Trophy className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>;
      case 'registration':
        return <Badge className="bg-blue-600 hover:bg-blue-700">Registration Open</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'upcoming':
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">Coming Soon</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mr-4 text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <Crown className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold">HubX Contests</h1>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Contests Joined</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.contestsJoined}</p>
                </div>
                <Trophy className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Best Rank</p>
                  <p className="text-2xl font-bold text-green-400">#{stats.currentRank}</p>
                </div>
                <Crown className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Prizes Won</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.prizesWon}</p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Competitors</p>
                  <p className="text-2xl font-bold text-purple-400">{stats.totalParticipants}</p>
                </div>
                <Users className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="active">Active Contests</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="space-y-6">
              {activeContests.map((contest) => (
                <Card key={contest.id} className="bg-gray-900 border-gray-800 hover:border-gray-600 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(contest.category)}
                            <h3 className="text-xl font-bold text-white">{contest.title}</h3>
                          </div>
                          {getStatusBadge(contest.status)}
                        </div>
                        
                        <p className="text-gray-400">{contest.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center text-yellow-400">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {contest.prize} Prize
                          </div>
                          <div className="flex items-center text-blue-400">
                            <Users className="w-4 h-4 mr-1" />
                            {contest.participants} participants
                          </div>
                          <div className="flex items-center text-green-400">
                            <Calendar className="w-4 h-4 mr-1" />
                            {contest.timeLeft}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Requirement:</span>
                            <span className="text-white">{contest.requirement}</span>
                          </div>
                          {contest.myRank && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Your Rank:</span>
                              <Badge className="bg-blue-600">#{contest.myRank}</Badge>
                            </div>
                          )}
                        </div>

                        {contest.status === 'active' && contest.progress > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Contest Progress</span>
                              <span className="text-white">{contest.progress}%</span>
                            </div>
                            <Progress value={contest.progress} className="w-full" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 lg:ml-6">
                        {contest.status === 'registration' ? (
                          <Button className="w-full lg:w-auto">
                            Join Contest
                          </Button>
                        ) : (
                          <Button variant="outline" className="w-full lg:w-auto">
                            View Details
                          </Button>
                        )}
                        {contest.myRank && (
                          <Button variant="ghost" size="sm" className="w-full lg:w-auto">
                            View My Progress
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="space-y-6">
              {completedContests.map((contest) => (
                <Card key={contest.id} className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(contest.category)}
                            <h3 className="text-xl font-bold text-white">{contest.title}</h3>
                          </div>
                          {getStatusBadge(contest.status)}
                        </div>
                        
                        <p className="text-gray-400">{contest.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center text-yellow-400">
                            <Crown className="w-4 h-4 mr-1" />
                            Winner: {contest.winner}
                          </div>
                          <div className="flex items-center text-blue-400">
                            <Users className="w-4 h-4 mr-1" />
                            {contest.participants} participants
                          </div>
                          {contest.myRank && (
                            <div className="flex items-center">
                              <Trophy className="w-4 h-4 mr-1 text-orange-400" />
                              <span className="text-orange-400">Your Rank: #{contest.myRank}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button variant="outline" className="w-full lg:w-auto">
                        View Results
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span>Current Leaderboard</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-lg font-semibold mb-2">Leaderboard Coming Soon</h3>
                  <p className="text-gray-400">Real-time rankings will be displayed here during active contests</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ContestsPage;