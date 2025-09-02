
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DollarSign, User, Calendar, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Payout {
  id: string;
  creator_id: string;
  amount: number;
  payout_method: string;
  payout_details: any;
  status: string;
  transaction_id?: string;
  requested_at: string;
  processed_at?: string;
  notes?: string;
  profiles?: {
    username: string;
    display_name: string;
  };
}

const PayoutManagement = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [processingNotes, setProcessingNotes] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const { data, error } = await supabase
        .from('payouts')
        .select(`
          *,
          profiles (
            username,
            display_name
          )
        `)
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Error fetching payouts:', error);
        toast.error('Failed to fetch payouts');
        return;
      }

      setPayouts(data || []);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      toast.error('Failed to fetch payouts');
    } finally {
      setLoading(false);
    }
  };

  const updatePayoutStatus = async (payoutId: string, status: string, transactionId?: string, notes?: string) => {
    try {
      const updateData: any = {
        status,
        processed_at: new Date().toISOString(),
        notes
      };

      if (transactionId) {
        updateData.transaction_id = transactionId;
      }

      const { error } = await supabase
        .from('payouts')
        .update(updateData)
        .eq('id', payoutId);

      if (error) {
        console.error('Error updating payout:', error);
        toast.error('Failed to update payout');
        return;
      }

      toast.success(`Payout ${status === 'completed' ? 'approved' : status}`);
      fetchPayouts();
      setSelectedPayout(null);
      setTransactionId('');
      setProcessingNotes('');
    } catch (error) {
      console.error('Error updating payout:', error);
      toast.error('Failed to update payout');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredPayouts = payouts.filter(payout => {
    if (filter === 'all') return true;
    return payout.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading payouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Payout Management</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payouts</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Pending</p>
                <p className="text-lg font-semibold">
                  ${payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-lg font-semibold">
                  {payouts.filter(p => p.status === 'processing').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-lg font-semibold">
                  {payouts.filter(p => p.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-lg font-semibold">
                  {payouts.filter(p => p.status === 'failed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payouts List */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPayouts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No payouts found</p>
            ) : (
              filteredPayouts.map((payout) => (
                <div key={payout.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {payout.profiles?.display_name || payout.profiles?.username || 'Unknown User'}
                        </span>
                      </div>
                      <Badge className={getStatusColor(payout.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(payout.status)}
                          <span className="capitalize">{payout.status}</span>
                        </div>
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">${payout.amount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground capitalize">{payout.payout_method}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>Requested: {new Date(payout.requested_at).toLocaleDateString()}</span>
                    </div>
                    {payout.transaction_id && (
                      <div className="flex items-center space-x-1">
                        <CreditCard className="w-3 h-3" />
                        <span>TX: {payout.transaction_id}</span>
                      </div>
                    )}
                  </div>

                  {payout.payout_details && (
                    <div className="mt-2 text-sm">
                      <strong>Details:</strong> {JSON.stringify(payout.payout_details, null, 2)}
                    </div>
                  )}

                  {payout.notes && (
                    <div className="mt-2 text-sm">
                      <strong>Notes:</strong> {payout.notes}
                    </div>
                  )}

                  {payout.status === 'pending' && (
                    <div className="mt-4 flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPayout(payout)}
                      >
                        Process
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updatePayoutStatus(payout.id, 'cancelled', undefined, 'Cancelled by admin')}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Process Payout Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Process Payout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p><strong>Creator:</strong> {selectedPayout.profiles?.display_name || selectedPayout.profiles?.username}</p>
                <p><strong>Amount:</strong> ${selectedPayout.amount.toFixed(2)}</p>
                <p><strong>Method:</strong> {selectedPayout.payout_method}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                <Input
                  id="transactionId"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Processing Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={processingNotes}
                  onChange={(e) => setProcessingNotes(e.target.value)}
                  placeholder="Add any notes about this payout"
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  className="flex-1"
                  onClick={() => updatePayoutStatus(selectedPayout.id, 'completed', transactionId, processingNotes)}
                >
                  Mark as Completed
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updatePayoutStatus(selectedPayout.id, 'processing', transactionId, processingNotes)}
                >
                  Set Processing
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => updatePayoutStatus(selectedPayout.id, 'failed', transactionId, processingNotes)}
                >
                  Mark as Failed
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSelectedPayout(null);
                  setTransactionId('');
                  setProcessingNotes('');
                }}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PayoutManagement;
