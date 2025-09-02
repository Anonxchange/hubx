import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EarningsStats {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  pendingPayouts: number;
  availableBalance: number;
  totalTips: number;
  premiumRevenue: number;
  viewEarnings: number;
  totalViews: number;
  premiumViews: number;
}

export interface EarningsRate {
  id: string;
  rate_type: 'free_video' | 'premium_video';
  rate_per_1k_views: number;
  effective_date: string;
  is_active: boolean;
}

export interface CreatorEarnings {
  id: string;
  creator_id: string;
  total_views: number;
  total_premium_views: number;
  total_earnings: number;
  current_balance: number;
  lifetime_earnings: number;
  created_at: string;
  updated_at: string;
}

export interface ViewEarning {
  id: string;
  video_id: string;
  creator_id: string;
  view_id: string;
  is_premium: boolean;
  earnings_amount: number;
  earnings_rate_per_1k: number;
  processed: boolean;
  created_at: string;
}

export interface Payout {
  id: string;
  creator_id: string;
  amount: number;
  payout_method: 'paypal' | 'crypto' | 'bank_transfer';
  payout_details: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transaction_id?: string;
  requested_at: string;
  processed_at?: string;
  notes?: string;
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

// Calculate and record earnings for a video view
export const calculateViewEarnings = async (
  videoId: string, 
  creatorId: string, 
  viewId: string, 
  isPremium: boolean = false
) => {
  try {
    // Get current earnings rates
    const { data: ratesData, error: ratesError } = await supabase
      .from('earnings_rates')
      .select('*')
      .eq('rate_type', isPremium ? 'premium_video' : 'free_video')
      .eq('is_active', true)
      .order('effective_date', { ascending: false })
      .limit(1);

    if (ratesError) {
      console.error('Error fetching earnings rates:', ratesError);
      return;
    }

    if (!ratesData || ratesData.length === 0) {
      console.error('No earnings rates found');
      return;
    }

    const rate = ratesData[0];
    const earningsPerView = rate.rate_per_1k_views / 1000; // Convert rate per 1k to per view

    // Insert view earning record
    const { error: viewEarningError } = await supabase
      .from('view_earnings')
      .insert({
        video_id: videoId,
        creator_id: creatorId,
        view_id: viewId,
        is_premium: isPremium,
        earnings_amount: earningsPerView,
        earnings_rate_per_1k: rate.rate_per_1k_views,
        processed: false
      });

    if (viewEarningError) {
      console.error('Error inserting view earning:', viewEarningError);
      return;
    }

    // Update creator earnings
    await updateCreatorEarnings(creatorId, earningsPerView, isPremium);
    
  } catch (error) {
    console.error('Error calculating view earnings:', error);
  }
};

// Update creator's total earnings
const updateCreatorEarnings = async (
  creatorId: string, 
  earningsAmount: number, 
  isPremium: boolean
) => {
  try {
    // First, try to get existing earnings record
    const { data: existingEarnings, error: fetchError } = await supabase
      .from('creator_earnings')
      .select('*')
      .eq('creator_id', creatorId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching creator earnings:', fetchError);
      return;
    }

    if (existingEarnings) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('creator_earnings')
        .update({
          total_views: isPremium ? existingEarnings.total_views : existingEarnings.total_views + 1,
          total_premium_views: isPremium ? existingEarnings.total_premium_views + 1 : existingEarnings.total_premium_views,
          total_earnings: existingEarnings.total_earnings + earningsAmount,
          current_balance: existingEarnings.current_balance + earningsAmount,
          lifetime_earnings: existingEarnings.lifetime_earnings + earningsAmount,
          updated_at: new Date().toISOString()
        })
        .eq('creator_id', creatorId);

      if (updateError) {
        console.error('Error updating creator earnings:', updateError);
      }
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('creator_earnings')
        .insert({
          creator_id: creatorId,
          total_views: isPremium ? 0 : 1,
          total_premium_views: isPremium ? 1 : 0,
          total_earnings: earningsAmount,
          current_balance: earningsAmount,
          lifetime_earnings: earningsAmount
        });

      if (insertError) {
        console.error('Error creating creator earnings:', insertError);
      }
    }
  } catch (error) {
    console.error('Error updating creator earnings:', error);
  }
};

// Calculate earnings from various sources including view-based earnings
export const getCreatorEarnings = async (creatorId: string): Promise<EarningsStats> => {
  try {
    // Get view-based earnings from new system
    const { data: viewEarningsData, error: viewError } = await supabase
      .from('creator_earnings')
      .select('*')
      .eq('creator_id', creatorId)
      .single();

    if (viewError && viewError.code !== 'PGRST116') {
      console.error('Error fetching view earnings:', viewError);
    }

    // Get tips received (existing functionality)
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

    // Get pending payouts
    const { data: pendingPayouts, error: payoutError } = await supabase
      .from('payouts')
      .select('amount')
      .eq('creator_id', creatorId)
      .in('status', ['pending', 'processing']);

    if (payoutError && payoutError.code !== 'PGRST116') {
      console.error('Error fetching pending payouts:', payoutError);
    }

    // Calculate totals
    const viewEarnings = viewEarningsData?.total_earnings || 0;
    const totalViews = viewEarningsData?.total_views || 0;
    const premiumViews = viewEarningsData?.total_premium_views || 0;
    const currentBalance = viewEarningsData?.current_balance || 0;
    
    const totalTips = tips?.reduce((sum, tip) => sum + parseFloat(tip.amount), 0) || 0;
    const premiumRevenue = subscriptions?.reduce((sum, sub) => sum + parseFloat(sub.amount), 0) || 0;
    const pendingPayoutAmount = pendingPayouts?.reduce((sum, payout) => sum + parseFloat(payout.amount), 0) || 0;
    
    const totalEarnings = viewEarnings + (totalTips / 100) + (premiumRevenue / 100);
    const availableBalance = currentBalance - pendingPayoutAmount;

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

    // Get this month's view earnings
    const { data: thisMonthViewEarnings } = await supabase
      .from('view_earnings')
      .select('earnings_amount')
      .eq('creator_id', creatorId)
      .gte('created_at', thisMonthStart.toISOString());

    const thisMonthViews = thisMonthViewEarnings?.reduce((sum, earning) => sum + earning.earnings_amount, 0) || 0;

    return {
      totalEarnings,
      thisMonth: (thisMonthTips / 100) + thisMonthViews,
      lastMonth: lastMonthTips / 100, // TODO: Add last month view earnings
      pendingPayouts: pendingPayoutAmount,
      availableBalance,
      totalTips: totalTips / 100,
      premiumRevenue: premiumRevenue / 100,
      viewEarnings,
      totalViews,
      premiumViews
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
      premiumRevenue: 0,
      viewEarnings: 0,
      totalViews: 0,
      premiumViews: 0
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

// Request payout
export const requestPayout = async (
  creatorId: string,
  amount: number,
  payoutMethod: 'paypal' | 'crypto' | 'bank_transfer',
  payoutDetails: any
): Promise<boolean> => {
  try {
    // Check if creator has sufficient balance
    const creatorEarnings = await getCreatorEarningsData(creatorId);
    
    if (!creatorEarnings || creatorEarnings.current_balance < amount) {
      toast.error('Insufficient balance for payout request');
      return false;
    }

    // Minimum payout amount check ($10)
    if (amount < 10) {
      toast.error('Minimum payout amount is $10.00');
      return false;
    }

    // Insert payout request
    const { error } = await supabase
      .from('payouts')
      .insert({
        creator_id: creatorId,
        amount: amount,
        payout_method: payoutMethod,
        payout_details: payoutDetails,
        status: 'pending'
      });

    if (error) {
      console.error('Error requesting payout:', error);
      toast.error('Failed to request payout');
      return false;
    }

    // Update creator balance (subtract requested amount)
    const { error: updateError } = await supabase
      .from('creator_earnings')
      .update({
        current_balance: creatorEarnings.current_balance - amount,
        updated_at: new Date().toISOString()
      })
      .eq('creator_id', creatorId);

    if (updateError) {
      console.error('Error updating creator balance:', updateError);
      toast.error('Failed to update balance');
      return false;
    }

    toast.success('Payout request submitted successfully');
    return true;
  } catch (error) {
    console.error('Error requesting payout:', error);
    toast.error('Failed to request payout');
    return false;
  }
};

// Get creator earnings data (internal function)
const getCreatorEarningsData = async (creatorId: string): Promise<CreatorEarnings | null> => {
  try {
    const { data, error } = await supabase
      .from('creator_earnings')
      .select('*')
      .eq('creator_id', creatorId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching creator earnings:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error getting creator earnings:', error);
    return null;
  }
};

// Get creator payouts
export const getCreatorPayouts = async (creatorId: string): Promise<Payout[]> => {
  try {
    const { data, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('creator_id', creatorId)
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching creator payouts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting creator payouts:', error);
    return [];
  }
};

// Get view earnings history
export const getViewEarnings = async (creatorId: string, limit = 100): Promise<ViewEarning[]> => {
  try {
    const { data, error } = await supabase
      .from('view_earnings')
      .select(`
        *,
        videos (title, is_premium)
      `)
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching view earnings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting view earnings:', error);
    return [];
  }
};

// Get earnings rates
export const getEarningsRates = async (): Promise<EarningsRate[]> => {
  try {
    const { data, error } = await supabase
      .from('earnings_rates')
      .select('*')
      .eq('is_active', true)
      .order('effective_date', { ascending: false });

    if (error) {
      console.error('Error fetching earnings rates:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting earnings rates:', error);
    return [];
  }
};