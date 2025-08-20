
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

      if (!data) return null;

      // Map snake_case from database to camelCase for TypeScript, converting null to undefined
      const profile: ProfileData = {
        id: data.id,
        username: data.username || undefined,
        fullName: data.full_name || undefined,
        email: data.email || undefined,
        bio: data.bio || undefined,
        location: data.location || undefined,
        website: data.website || undefined,
        avatarUrl: data.avatar_url || undefined,
        profilePictureUrl: data.profile_picture_url || undefined,
        coverPhotoUrl: data.cover_photo_url || undefined,
        userType: data.user_type as 'user' | 'individual_creator' | 'studio_creator' || undefined,
        twoFactorEnabled: data.two_factor_enabled || undefined,
        twoFactorSecret: data.two_factor_secret || undefined,
        backupCodes: data.backup_codes || undefined,
        tipDescription: data.tip_description || undefined,
        tipPaypal: data.tip_paypal || undefined,
        tipVenmo: data.tip_venmo || undefined,
        tipCashapp: data.tip_cashapp || undefined,
        tipBitcoin: data.tip_bitcoin || undefined,
        tipEthereum: data.tip_ethereum || undefined,
        createdAt: data.created_at || undefined,
        updatedAt: data.updated_at || undefined
      };

      console.log('Mapped profile data:', profile);
      return profile;
    } catch (error) {
      console.error('Error in getProfile:', error);
      return null;
    }
  },

  async updateProfile(userId: string, updates: Partial<ProfileData>): Promise<boolean> {
    try {
      // Map camelCase to snake_case for Supabase
      const dbUpdates: any = {};
      
      if (updates.username !== undefined) dbUpdates.username = updates.username;
      if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.website !== undefined) dbUpdates.website = updates.website;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.profilePictureUrl !== undefined) dbUpdates.profile_picture_url = updates.profilePictureUrl;
      if (updates.coverPhotoUrl !== undefined) dbUpdates.cover_photo_url = updates.coverPhotoUrl;
      if (updates.userType !== undefined) dbUpdates.user_type = updates.userType;
      if (updates.twoFactorEnabled !== undefined) dbUpdates.two_factor_enabled = updates.twoFactorEnabled;
      if (updates.twoFactorSecret !== undefined) dbUpdates.two_factor_secret = updates.twoFactorSecret;
      if (updates.backupCodes !== undefined) dbUpdates.backup_codes = updates.backupCodes;
      if (updates.tipDescription !== undefined) dbUpdates.tip_description = updates.tipDescription;
      if (updates.tipPaypal !== undefined) dbUpdates.tip_paypal = updates.tipPaypal;
      if (updates.tipVenmo !== undefined) dbUpdates.tip_venmo = updates.tipVenmo;
      if (updates.tipCashapp !== undefined) dbUpdates.tip_cashapp = updates.tipCashapp;
      if (updates.tipBitcoin !== undefined) dbUpdates.tip_bitcoin = updates.tipBitcoin;
      if (updates.tipEthereum !== undefined) dbUpdates.tip_ethereum = updates.tipEthereum;
      
      // Always add updated timestamp
      dbUpdates.updated_at = new Date().toISOString();

      console.log('Updating profile with data:', dbUpdates);

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile:', error);
        return false;
      }

      console.log('Profile updated successfully');
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
          updated_at: new Date().toISOString()
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
      // Map camelCase to snake_case for Supabase
      const dbData: any = {
        id: profileData.id,
        username: profileData.username,
        email: profileData.email,
        full_name: profileData.fullName,
        bio: profileData.bio,
        avatar_url: profileData.avatarUrl,
        profile_picture_url: profileData.profilePictureUrl,
        cover_photo_url: profileData.coverPhotoUrl,
        website: profileData.website,
        location: profileData.location,
        user_type: profileData.userType,
        two_factor_enabled: profileData.twoFactorEnabled,
        two_factor_secret: profileData.twoFactorSecret,
        backup_codes: profileData.backupCodes,
        tip_description: profileData.tipDescription,
        tip_paypal: profileData.tipPaypal,
        tip_venmo: profileData.tipVenmo,
        tip_cashapp: profileData.tipCashapp,
        tip_bitcoin: profileData.tipBitcoin,
        tip_ethereum: profileData.tipEthereum,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(dbData).forEach(key => {
        if (dbData[key] === undefined) {
          delete dbData[key];
        }
      });

      console.log('Creating profile with data:', dbData);

      const { error } = await supabase
        .from('profiles')
        .upsert(dbData, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error creating/updating profile:', error);
        return false;
      }

      console.log('Profile created/updated successfully');
      return true;
    } catch (error) {
      console.error('Error in createProfile:', error);
      return false;
    }
  }
};
