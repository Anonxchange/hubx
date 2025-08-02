
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'user' | 'creator';

export interface UserProfile {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

// Get current user's role
export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.role as UserRole;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
};

// Check if user has specific role
export const hasRole = async (userId: string, role: UserRole): Promise<boolean> => {
  const userRole = await getUserRole(userId);
  return userRole === role;
};

// Check if user is admin
export const isAdmin = async (userId: string): Promise<boolean> => {
  return hasRole(userId, 'admin');
};

// Assign role to user (admin only)
export const assignUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role });

    return !error;
  } catch (error) {
    console.error('Error assigning role:', error);
    return false;
  }
};

// Get current authenticated user and role
export const getCurrentUserWithRole = async (): Promise<{ user: User; role: UserRole | null } | null> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  const role = await getUserRole(user.id);
  
  return { user, role };
};
