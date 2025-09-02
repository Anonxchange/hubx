
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, TrendingUp, Calendar, Download, CreditCard, Plus, Eye, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import {
  getCreatorEarnings,
  getEarningTransactions,
  getCreatorPayouts,
  requestPayout,
  getViewEarnings,
  EarningsStats,
  EarningTransaction,
  Payout,
  ViewEarning
} from '@/services/earningsService';

const EarningsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<EarningsStats>({
    totalEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    pendingPayouts: 0,
    availableBalance: 0,
    totalTips: 0,
    premiumRevenue: 0,
    viewEarnings: 0,
    totalViews: 0,
    premiumViews: 0
  });
  const [transactions, setTransactions] = useState<EarningTransaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [viewEarnings, setViewEarnings] = useState<ViewEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'paypal' | 'crypto' | 'bank_transfer'>('paypal');
  const [payoutDetails, setPayoutDetails] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchEarningsData();
    }
  }, [user?.id]);

  const fetchEarningsData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Fetch all earnings data
      const [earningsStats, transactionsData, payoutsData, viewEarningsData] = await Promise.all([
        getCreatorEarnings(user.id),
        getEarningTransactions(user.id),
        getCreatorPayouts(user.id),
        getViewEarnings(user.id, 50)
      ]);

      setStats(earningsStats);
      setTransactions(transactionsData);
      setPayouts(payoutsData);
      setViewEarnings(viewEarningsData);
    } catch (error) {
      console.error('Error fetching earnings data:', error);
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutRequest = async () => {
    if (!user?.id) return;

    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount < 10) {
      toast({
        title: "Error",
        description: "Minimum payout amount is $10.00",
        variant: "destructive"
      });
      return;
    }

    if (amount > stats.availableBalance) {
      toast({
        title: "Error",
        description: "Insufficient balance for this payout amount",
        variant: "destructive"
      });
      return;
    }

    let details: any = {};
    if (payoutMethod === 'paypal') {
      details = { email: payoutDetails };
    } else if (payoutMethod === 'crypto') {
      details = { wallet_address: payoutDetails };
    } else if (payoutMethod === 'bank_transfer') {
      details = { account_details: payoutDetails };
    }

    const success = await requestPayout(user.id, amount, payoutMethod, details);
    if (success) {
      setShowPayoutModal(false);
      setPayoutAmount('');
      setPayoutDetails('');
      fetchEarningsData(); // Refresh data
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl">Loading earnings data...</div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">Earnings</h1>
        </div>

        {/* Earnings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-400">${stats.totalEarnings.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">This Month</p>
                  <p className="text-2xl font-bold">${stats.thisMonth.toFixed(2)}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Views</p>
                  <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
                </div>
                <Eye className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending Payouts</p>
                  <p className="text-2xl font-bold text-yellow-400">${stats.pendingPayouts.toFixed(2)}</p>
                </div>
                <Download className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Available Balance</p>
                  <p className="text-2xl font-bold text-green-400">${stats.availableBalance.toFixed(2)}</p>
                </div>
                <CreditCard className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="view-earnings">View Earnings</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Tips Received</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-400">${stats.totalTips.toFixed(2)}</div>
                    <p className="text-gray-400 text-sm">From viewer tips</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg">View Earnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-400">${stats.viewEarnings.toFixed(2)}</div>
                    <p className="text-gray-400 text-sm">From video views</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Premium Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-400">${stats.premiumRevenue.toFixed(2)}</div>
                    <p className="text-gray-400 text-sm">From premium content</p>
                  </CardContent>
                </Card>
              </div>

              {stats.availableBalance >= 10 && (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Ready for Payout</h3>
                        <p className="text-gray-400">You have ${stats.availableBalance.toFixed(2)} available for withdrawal</p>
                      </div>
                      <Dialog open={showPayoutModal} onOpenChange={setShowPayoutModal}>
                        <DialogTrigger asChild>
                          <Button className="px-8">Request Payout</Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-800 text-white">
                          <DialogHeader>
                            <DialogTitle>Request Payout</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="amount">Amount (USD)</Label>
                              <Input
                                id="amount"
                                type="number"
                                min="10"
                                max={stats.availableBalance}
                                value={payoutAmount}
                                onChange={(e) => setPayoutAmount(e.target.value)}
                                placeholder="Minimum $10.00"
                                className="bg-gray-800 border-gray-700"
                              />
                            </div>
                            <div>
                              <Label htmlFor="method">Payout Method</Label>
                              <Select value={payoutMethod} onValueChange={(value: any) => setPayoutMethod(value)}>
                                <SelectTrigger className="bg-gray-800 border-gray-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700">
                                  <SelectItem value="paypal">PayPal</SelectItem>
                                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="details">
                                {payoutMethod === 'paypal' && 'PayPal Email'}
                                {payoutMethod === 'crypto' && 'Wallet Address'}
                                {payoutMethod === 'bank_transfer' && 'Bank Account Details'}
                              </Label>
                              <Textarea
                                id="details"
                                value={payoutDetails}
                                onChange={(e) => setPayoutDetails(e.target.value)}
                                placeholder={
                                  payoutMethod === 'paypal' ? 'your@email.com' :
                                  payoutMethod === 'crypto' ? 'Your wallet address' :
                                  'Bank account details'
                                }
                                className="bg-gray-800 border-gray-700"
                              />
                            </div>
                            <Button onClick={handlePayoutRequest} className="w-full">
                              Request Payout
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="view-earnings">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>View Earnings History</CardTitle>
              </CardHeader>
              <CardContent>
                {viewEarnings.length > 0 ? (
                  <div className="space-y-4">
                    {viewEarnings.map((earning) => (
                      <div key={earning.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Award className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="font-medium">
                              {earning.is_premium ? 'Premium' : 'Free'} Video View
                            </p>
                            <p className="text-sm text-gray-400">
                              {formatDate(earning.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-400">
                            +${earning.earnings_amount.toFixed(4)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Rate: ${earning.earnings_rate_per_1k}/1k views
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Eye className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-lg font-semibold mb-2">No view earnings yet</h3>
                    <p className="text-gray-400">Upload videos and get views to start earning</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <CreditCard className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="font-medium">{transaction.source}</p>
                            <p className="text-sm text-gray-400">{transaction.description}</p>
                            <p className="text-xs text-gray-400">{formatDate(transaction.date)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-400">
                            +${transaction.amount.toFixed(2)} {transaction.currency}
                          </p>
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                    <p className="text-gray-400">Your transaction history will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
              </CardHeader>
              <CardContent>
                {payouts.length > 0 ? (
                  <div className="space-y-4">
                    {payouts.map((payout) => (
                      <div key={payout.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Download className="w-5 h-5 text-yellow-400" />
                          <div>
                            <p className="font-medium">
                              {payout.payout_method.charAt(0).toUpperCase() + payout.payout_method.slice(1).replace('_', ' ')} Payout
                            </p>
                            <p className="text-sm text-gray-400">
                              Requested: {formatDate(payout.requested_at)}
                            </p>
                            {payout.processed_at && (
                              <p className="text-xs text-gray-400">
                                Processed: {formatDate(payout.processed_at)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${payout.amount.toFixed(2)}</p>
                          <Badge className={getStatusColor(payout.status)}>
                            {payout.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Download className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-lg font-semibold mb-2">No payouts requested</h3>
                    <p className="text-gray-400">Your payout history will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EarningsPage;
