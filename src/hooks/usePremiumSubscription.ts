import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PremiumSubscription {
  id: string;
  plan_name: string;
  status: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
}

export const usePremiumSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<PremiumSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user?.id) {
        setIsLoading(false);
        setIsPremium(false);
        setSubscription(null);
        return;
      }

      try {
        setIsLoading(true);

        // Check for active premium subscription
        const { data: premiumSub, error } = await supabase
          .from('premium_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .in('status', ['active', 'trialing'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error checking premium subscription:', error);
          setIsPremium(false);
          setSubscription(null);
          return;
        }

        if (premiumSub) {
          // Check if subscription is still valid (not expired)
          const now = new Date();
          const endDate = premiumSub.end_date ? new Date(premiumSub.end_date) : null;
          
          const isValid = !endDate || endDate > now;
          
          if (isValid) {
            setIsPremium(true);
            setSubscription(premiumSub);
          } else {
            // Subscription expired, deactivate it
            await supabase
              .from('premium_subscriptions')
              .update({ is_active: false, status: 'expired' })
              .eq('id', premiumSub.id);
            
            setIsPremium(false);
            setSubscription(null);
          }
        } else {
          setIsPremium(false);
          setSubscription(null);
        }
      } catch (error) {
        console.error('Error in premium subscription check:', error);
        setIsPremium(false);
        setSubscription(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremiumStatus();
  }, [user?.id]);

  const refreshSubscription = () => {
    if (user?.id) {
      setIsLoading(true);
      // Re-run the effect by forcing a refresh
      const checkPremiumStatus = async () => {
        try {
          const { data: premiumSub, error } = await supabase
            .from('premium_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .in('status', ['active', 'trialing'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error) {
            console.error('Error refreshing premium subscription:', error);
            return;
          }

          if (premiumSub) {
            const now = new Date();
            const endDate = premiumSub.end_date ? new Date(premiumSub.end_date) : null;
            const isValid = !endDate || endDate > now;
            
            if (isValid) {
              setIsPremium(true);
              setSubscription(premiumSub);
            } else {
              setIsPremium(false);
              setSubscription(null);
            }
          } else {
            setIsPremium(false);
            setSubscription(null);
          }
        } catch (error) {
          console.error('Error refreshing subscription:', error);
        } finally {
          setIsLoading(false);
        }
      };

      checkPremiumStatus();
    }
  };

  return {
    isPremium,
    subscription,
    isLoading,
    refreshSubscription
  };
};