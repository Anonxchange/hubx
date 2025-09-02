import { supabase } from '@/integrations/supabase/client';

export interface EarningsStats {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  pendingPayouts: number;
  availableBalance: number;
  totalTips: number;
  premiumRevenue: number;
}

export interface EarningTransaction {
  id: string;
  amount: number;
  currency: string;
  source: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  description: string;
}

// Calculate earnings from various sources
export const getCreatorEarnings = async (creatorId: string): Promise<EarningsStats> => {
  try {
    // Get tips received
    const { data: tips, error: tipsError } = await supabase
      .from('tips')
      .select('amount, created_at')
      .eq('to_creator_id', creatorId)
      .eq('status', 'completed');

    if (tipsError && tipsError.code !== 'PGRST116') {
      console.error('Error fetching tips:', tipsError);
    }

    // Get premium subscription revenue (for studio creators)
    const { data: subscriptions, error: subsError } = await supabase
      .from('premium_subscriptions')
      .select('amount, start_date, status')
      .eq('user_id', creatorId)
      .eq('status', 'active');

    if (subsError && subsError.code !== 'PGRST116') {
      console.error('Error fetching subscriptions:', subsError);
    }

    // Calculate totals
    const totalTips = tips?.reduce((sum, tip) => sum + parseFloat(tip.amount), 0) || 0;
    const premiumRevenue = subscriptions?.reduce((sum, sub) => sum + parseFloat(sub.amount), 0) || 0;
    const totalEarnings = totalTips + premiumRevenue;

    // Calculate this month and last month
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthTips = tips?.filter(tip => 
      new Date(tip.created_at) >= thisMonthStart
    ).reduce((sum, tip) => sum + parseFloat(tip.amount), 0) || 0;

    const lastMonthTips = tips?.filter(tip => {
      const tipDate = new Date(tip.created_at);
      return tipDate >= lastMonthStart && tipDate <= lastMonthEnd;
    }).reduce((sum, tip) => sum + parseFloat(tip.amount), 0) || 0;

    return {
      totalEarnings: totalEarnings / 100, // Convert from cents to dollars
      thisMonth: thisMonthTips / 100,
      lastMonth: lastMonthTips / 100,
      pendingPayouts: 0, // Will be calculated based on payout requests
      availableBalance: totalEarnings / 100, // Simplified - actual implementation would subtract payouts
      totalTips: totalTips / 100,
      premiumRevenue: premiumRevenue / 100
    };
  } catch (error) {
    console.error('Error calculating earnings:', error);
    return {
      totalEarnings: 0,
      thisMonth: 0,
      lastMonth: 0,
      pendingPayouts: 0,
      availableBalance: 0,
      totalTips: 0,
      premiumRevenue: 0
    };
  }
};

// Get earning transactions history
export const getEarningTransactions = async (creatorId: string): Promise<EarningTransaction[]> => {
  try {
    // Get tips as transactions
    const { data: tips, error: tipsError } = await supabase
      .from('tips')
      .select('*')
      .eq('to_creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (tipsError && tipsError.code !== 'PGRST116') {
      console.error('Error fetching tip transactions:', tipsError);
      return [];
    }

    const transactions: EarningTransaction[] = [];

    // Convert tips to transactions
    if (tips) {
      tips.forEach(tip => {
        transactions.push({
          id: tip.id,
          amount: parseFloat(tip.amount) / 100,
          currency: tip.currency || 'USD',
          source: `Tip - ${tip.payment_method}`,
          status: tip.status as 'completed' | 'pending' | 'failed',
          date: tip.created_at,
          description: tip.message || 'User tip'
        });
      });
    }

    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

// Get earnings analytics for charts/graphs
export const getEarningsAnalytics = async (creatorId: string, period: 'week' | 'month' | 'year' = 'month') => {
  try {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    const { data: tips, error } = await supabase
      .from('tips')
      .select('amount, created_at, payment_method')
      .eq('to_creator_id', creatorId)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString());

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching earnings analytics:', error);
      return { dailyEarnings: [], paymentMethods: {} };
    }

    // Group by day and payment method
    const dailyEarnings: { [key: string]: number } = {};
    const paymentMethods: { [key: string]: number } = {};

    tips?.forEach(tip => {
      const date = new Date(tip.created_at).toDateString();
      const amount = parseFloat(tip.amount) / 100;
      
      dailyEarnings[date] = (dailyEarnings[date] || 0) + amount;
      paymentMethods[tip.payment_method] = (paymentMethods[tip.payment_method] || 0) + amount;
    });

    return {
      dailyEarnings: Object.entries(dailyEarnings).map(([date, amount]) => ({
        date,
        amount
      })),
      paymentMethods
    };
  } catch (error) {
    console.error('Error getting earnings analytics:', error);
    return { dailyEarnings: [], paymentMethods: {} };
  }
};