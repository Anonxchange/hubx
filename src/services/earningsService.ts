
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

// Retry function for network requests
const retryRequest = async <T>(
  requestFn: () => Promise<{ data: T | null; error: any }>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<{ data: T | null; error: any }> => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await requestFn();
      if (!result.error || result.error.code === 'PGRST116') {
        return result;
      }
      lastError = result.error;
    } catch (error) {
      lastError = error;
    }
    
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  
  return { data: null, error: lastError };
};

// Calculate earnings from various sources including view-based earnings
export const getCreatorEarnings = async (creatorId: string): Promise<EarningsStats> => {
  try {
    console.log('Fetching earnings for creator:', creatorId);

    // Get actual view-based earnings from creator_earnings table with retry
    const { data: creatorEarningsData, error: creatorEarningsError } = await retryRequest(() =>
      supabase
        .from('creator_earnings')
        .select('*')
        .eq('creator_id', creatorId)
        .single()
    );

    if (creatorEarningsError && creatorEarningsError.code !== 'PGRST116') {
      console.error('Error fetching creator earnings:', creatorEarningsError);
    }

    // Get individual view earnings records with retry
    const { data: viewEarningsRecords, error: viewEarningsError } = await retryRequest(() =>
      supabase
        .from('view_earnings')
        .select('earnings_amount, is_premium, created_at')
        .eq('creator_id', creatorId)
    );

    if (viewEarningsError && viewEarningsError.code !== 'PGRST116') {
      console.error('Error fetching view earnings records:', viewEarningsError);
    }

    // Get tips received (amount should be in dollars, not cents) with retry
    const { data: tips, error: tipsError } = await retryRequest(() =>
      supabase
        .from('tips')
        .select('amount, created_at, currency')
        .eq('to_creator_id', creatorId)
        .eq('status', 'completed')
    );

    if (tipsError && tipsError.code !== 'PGRST116') {
      console.error('Error fetching tips:', tipsError);
    }

    // Get subscription earnings for premium revenue with retry
    const { data: subscriptionEarnings, error: subscriptionEarningsError } = await retryRequest(() =>
      supabase
        .from('subscription_earnings')
        .select('earnings_amount, created_at')
        .eq('creator_id', creatorId)
        .eq('processed', true)
    );

    if (subscriptionEarningsError && subscriptionEarningsError.code !== 'PGRST116') {
      console.error('Error fetching subscription earnings:', subscriptionEarningsError);
    }

    // Get pending payouts with retry
    const { data: pendingPayouts, error: payoutError } = await retryRequest(() =>
      supabase
        .from('payouts')
        .select('amount')
        .eq('creator_id', creatorId)
        .in('status', ['pending', 'processing'])
    );

    if (payoutError && payoutError.code !== 'PGRST116') {
      console.error('Error fetching pending payouts:', payoutError);
    }

    // Get video views count for stats with retry
    const { data: videoViews, error: videoViewsError } = await retryRequest(() =>
      supabase
        .from('video_views')
        .select(`
          id,
          videos!inner(is_premium, owner_id)
        `)
        .eq('videos.owner_id', creatorId)
    );

    if (videoViewsError && videoViewsError.code !== 'PGRST116') {
      console.error('Error fetching video views:', videoViewsError);
    }

    // Calculate view earnings from actual records
    const viewEarningsTotal = viewEarningsRecords?.reduce((sum, record) => sum + (record.earnings_amount || 0), 0) || 0;
    
    // Calculate view counts
    const totalViews = videoViews?.length || 0;
    const premiumViews = videoViews?.filter(view => view.videos?.is_premium).length || 0;

    // Calculate tips total (assuming amount is already in dollars)
    const totalTips = tips?.reduce((sum, tip) => {
      const amount = parseFloat(tip.amount) || 0;
      // If amount seems to be in cents (very large numbers), convert to dollars
      return sum + (amount > 1000 ? amount / 100 : amount);
    }, 0) || 0;

    // Calculate premium revenue from subscription earnings
    const premiumRevenue = subscriptionEarnings?.reduce((sum, earning) => sum + (earning.earnings_amount || 0), 0) || 0;

    // Calculate pending payouts
    const pendingPayoutAmount = pendingPayouts?.reduce((sum, payout) => sum + (payout.amount || 0), 0) || 0;

    // Calculate totals using actual earnings data
    const actualCurrentBalance = creatorEarningsData?.current_balance || 0;
    const totalEarnings = viewEarningsTotal + totalTips + premiumRevenue;
    const availableBalance = Math.max(0, totalEarnings - pendingPayoutAmount);

    // Calculate monthly earnings
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Calculate this month's earnings
    const thisMonthTips = tips?.filter(tip => 
      new Date(tip.created_at) >= thisMonthStart
    ).reduce((sum, tip) => {
      const amount = parseFloat(tip.amount) || 0;
      return sum + (amount > 1000 ? amount / 100 : amount);
    }, 0) || 0;

    const thisMonthViewEarnings = viewEarningsRecords?.filter(record =>
      new Date(record.created_at) >= thisMonthStart
    ).reduce((sum, record) => sum + (record.earnings_amount || 0), 0) || 0;

    const thisMonthPremiumRevenue = subscriptionEarnings?.filter(earning =>
      new Date(earning.created_at) >= thisMonthStart
    ).reduce((sum, earning) => sum + (earning.earnings_amount || 0), 0) || 0;

    // Calculate last month's earnings
    const lastMonthTips = tips?.filter(tip => {
      const tipDate = new Date(tip.created_at);
      return tipDate >= lastMonthStart && tipDate <= lastMonthEnd;
    }).reduce((sum, tip) => {
      const amount = parseFloat(tip.amount) || 0;
      return sum + (amount > 1000 ? amount / 100 : amount);
    }, 0) || 0;

    const lastMonthViewEarnings = viewEarningsRecords?.filter(record => {
      const recordDate = new Date(record.created_at);
      return recordDate >= lastMonthStart && recordDate <= lastMonthEnd;
    }).reduce((sum, record) => sum + (record.earnings_amount || 0), 0) || 0;

    const lastMonthPremiumRevenue = subscriptionEarnings?.filter(earning => {
      const earningDate = new Date(earning.created_at);
      return earningDate >= lastMonthStart && earningDate <= lastMonthEnd;
    }).reduce((sum, earning) => sum + (earning.earnings_amount || 0), 0) || 0;

    const result = {
      totalEarnings,
      thisMonth: thisMonthTips + thisMonthViewEarnings + thisMonthPremiumRevenue,
      lastMonth: lastMonthTips + lastMonthViewEarnings + lastMonthPremiumRevenue,
      pendingPayouts: pendingPayoutAmount,
      availableBalance,
      totalTips,
      premiumRevenue,
      viewEarnings: viewEarningsTotal,
      totalViews,
      premiumViews
    };

    console.log('Creator earnings calculation:', {
      creatorId,
      viewEarningsTotal,
      totalViews,
      premiumViews,
      totalTips,
      premiumRevenue,
      actualTipsCount: tips?.length || 0,
      actualViewEarningsCount: viewEarningsRecords?.length || 0,
      subscriptionEarningsCount: subscriptionEarnings?.length || 0,
      hasCreatorEarningsRecord: !!creatorEarningsData,
      result
    });

    return result;
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
    const transactions: EarningTransaction[] = [];

    // Get tips as transactions with retry
    const { data: tips, error: tipsError } = await retryRequest(() =>
      supabase
        .from('tips')
        .select('*')
        .eq('to_creator_id', creatorId)
        .order('created_at', { ascending: false })
        .limit(25)
    );

    if (tipsError && tipsError.code !== 'PGRST116') {
      console.error('Error fetching tip transactions:', tipsError);
    }

    // Get view earnings as transactions with retry
    const { data: viewEarnings, error: viewEarningsError } = await retryRequest(() =>
      supabase
        .from('view_earnings')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false })
        .limit(25)
    );

    if (viewEarningsError && viewEarningsError.code !== 'PGRST116') {
      console.error('Error fetching view earnings transactions:', viewEarningsError);
    }

    // Get subscription earnings as transactions with retry
    const { data: subscriptionEarnings, error: subscriptionEarningsError } = await retryRequest(() =>
      supabase
        .from('subscription_earnings')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false })
        .limit(25)
    );

    if (subscriptionEarningsError && subscriptionEarningsError.code !== 'PGRST116') {
      console.error('Error fetching subscription earnings transactions:', subscriptionEarningsError);
    }

    // Convert tips to transactions
    if (tips) {
      tips.forEach(tip => {
        const amount = parseFloat(tip.amount) || 0;
        transactions.push({
          id: `tip-${tip.id}`,
          amount: amount > 1000 ? amount / 100 : amount, // Handle cents conversion
          currency: tip.currency || 'USD',
          source: `Tip - ${tip.payment_method || 'Unknown'}`,
          status: tip.status as 'completed' | 'pending' | 'failed',
          date: tip.created_at,
          description: tip.message || 'User tip'
        });
      });
    }

    // Convert view earnings to transactions
    if (viewEarnings) {
      viewEarnings.forEach(earning => {
        transactions.push({
          id: `view-${earning.id}`,
          amount: earning.earnings_amount || 0,
          currency: 'USD',
          source: earning.is_premium ? 'Premium Video View' : 'Video View',
          status: 'completed',
          date: earning.created_at,
          description: `Earnings from video view`
        });
      });
    }

    // Convert subscription earnings to transactions
    if (subscriptionEarnings) {
      subscriptionEarnings.forEach(earning => {
        transactions.push({
          id: `subscription-${earning.id}`,
          amount: earning.earnings_amount || 0,
          currency: 'USD',
          source: 'Premium Subscription',
          status: 'completed',
          date: earning.created_at,
          description: `Earnings from premium subscription`
        });
      });
    }

    // Sort all transactions by date (newest first) and limit to 50
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return transactions.slice(0, 50);
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

// Calculate and record subscription-based earnings for a creator
export const calculateSubscriptionEarnings = async (
  creatorId: string,
  subscriberId: string,
  subscriptionType: 'monthly' | 'yearly' = 'monthly'
) => {
  try {
    // Get subscription earnings rate (configurable)
    const subscriptionRates = {
      monthly: 0.35, // $0.35 per subscriber per month
      yearly: 4.20   // $4.20 per subscriber per year (equivalent to monthly)
    };

    const earningsAmount = subscriptionRates[subscriptionType];

    // Insert subscription earning record
    const { error: subscriptionEarningError } = await supabase
      .from('subscription_earnings')
      .insert({
        creator_id: creatorId,
        subscriber_id: subscriberId,
        subscription_type: subscriptionType,
        earnings_amount: earningsAmount,
        processed: false
      });

    if (subscriptionEarningError) {
      console.error('Error inserting subscription earning:', subscriptionEarningError);
      return;
    }

    // Update creator earnings
    await updateCreatorSubscriptionEarnings(creatorId, earningsAmount);
    
  } catch (error) {
    console.error('Error calculating subscription earnings:', error);
  }
};

// Update creator's subscription-based earnings
const updateCreatorSubscriptionEarnings = async (
  creatorId: string, 
  earningsAmount: number
) => {
  try {
    // Get existing earnings record
    const { data: existingEarnings, error: fetchError } = await supabase
      .from('creator_earnings')
      .select('*')
      .eq('creator_id', creatorId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching creator earnings:', fetchError);
      return;
    }

    if (existingEarnings) {
      // Update existing record with subscription earnings
      const { error: updateError } = await supabase
        .from('creator_earnings')
        .update({
          total_earnings: existingEarnings.total_earnings + earningsAmount,
          current_balance: existingEarnings.current_balance + earningsAmount,
          lifetime_earnings: existingEarnings.lifetime_earnings + earningsAmount,
          updated_at: new Date().toISOString()
        })
        .eq('creator_id', creatorId);

      if (updateError) {
        console.error('Error updating creator subscription earnings:', updateError);
      }
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('creator_earnings')
        .insert({
          creator_id: creatorId,
          total_views: 0,
          total_premium_views: 0,
          total_earnings: earningsAmount,
          current_balance: earningsAmount,
          lifetime_earnings: earningsAmount
        });

      if (insertError) {
        console.error('Error creating creator earnings for subscription:', insertError);
      }
    }
  } catch (error) {
    console.error('Error updating creator subscription earnings:', error);
  }
};

// Get subscription earnings rates (configurable)
export const getSubscriptionRates = async () => {
  try {
    // For now, return hardcoded rates - could be moved to database
    return {
      monthly: 0.35,  // $0.35 per subscriber per month
      yearly: 4.20,   // $4.20 per subscriber per year
      minimum: 0.20,  // Minimum rate
      maximum: 0.50   // Maximum rate
    };
  } catch (error) {
    console.error('Error getting subscription rates:', error);
    return {
      monthly: 0.35,
      yearly: 4.20,
      minimum: 0.20,
      maximum: 0.50
    };
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
    const { data, error } = await retryRequest(() =>
      supabase
        .from('payouts')
        .select('*')
        .eq('creator_id', creatorId)
        .order('requested_at', { ascending: false })
    );

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
    const { data, error } = await retryRequest(() =>
      supabase
        .from('view_earnings')
        .select(`
          *,
          videos (title, is_premium)
        `)
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false })
        .limit(limit)
    );

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
