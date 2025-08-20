
import { supabase } from '../integrations/supabase/client';

export interface ProfileTips {
  tipDescription?: string;
  tipPaypal?: string;
  tipVenmo?: string;
  tipCashapp?: string;
  tipBitcoin?: string;
  tipEthereum?: string;
}

export interface ProfileData {
  id: string;
  username?: string;
  fullName?: string;
  email?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatarUrl?: string;
  profilePictureUrl?: string;
  coverPhotoUrl?: string;
  userType?: 'user' | 'individual_creator' | 'studio_creator';
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
  tipDescription?: string;
  tipPaypal?: string;
  tipVenmo?: string;
  tipCashapp?: string;
  tipBitcoin?: string;
  tipEthereum?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const profileService = {
  async getProfile(userId: string): Promise<ProfileData | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getProfile:', error);
      return null;
    }
  },

  async updateProfile(userId: string, updates: Partial<ProfileData>): Promise<boolean> {
    try {
      // Add updated timestamp
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updatesWithTimestamp)
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return false;
    }
  },

  async updateTips(userId: string, tips: ProfileTips): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...tips,
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating tips:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateTips:', error);
      return false;
    }
  },

  async createProfile(profileData: Partial<ProfileData>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          ...profileData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error creating/updating profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createProfile:', error);
      return false;
    }
  }
};
