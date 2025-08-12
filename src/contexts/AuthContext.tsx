import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserType = 'user' | 'individual_creator' | 'studio_creator';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    user_type?: UserType;
  };
  email_confirmed_at?: string;
}

interface AuthError {
  message: string;
}

interface AuthContextType {
  user: User | null;
  userType: UserType | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    userType: UserType,
    fullName?: string
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string,
    userType?: UserType
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  isEmailConfirmed: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false);

  // Restore from localStorage instantly to prevent "unclickable" phase
  useEffect(() => {
    const cachedUser = localStorage.getItem('auth_user');
    const cachedUserType = localStorage.getItem('auth_user_type') as UserType | null;

    if (cachedUser) {
      try {
        const parsedUser = JSON.parse(cachedUser) as User;
        setUser(parsedUser);
        if (cachedUserType) setUserType(cachedUserType);
        setIsEmailConfirmed(Boolean(parsedUser.email_confirmed_at));
      } catch (err) {
        console.error('Error parsing cached user:', err);
      }
    }
  }, []);

  // Helper to set user in state + localStorage
  const setUserAndCache = (currentUser: User, type: UserType) => {
    setUser(currentUser);
    setUserType(type);
    setIsEmailConfirmed(Boolean(currentUser.email_confirmed_at));

    localStorage.setItem('auth_user', JSON.stringify(currentUser));
    localStorage.setItem('auth_user_type', type);
  };

  const fetchUserAndSetType = async (currentUser: User) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', currentUser.id)
      .single();

    if (!error && profile?.user_type) {
      setUserAndCache(currentUser, profile.user_type as UserType);
    } else {
      let metadataUserType = currentUser.user_metadata?.user_type as UserType | undefined;
      if (!metadataUserType) {
        const storedUserType = localStorage.getItem(`user_type_${currentUser.id}`) as UserType | null;
        if (storedUserType) {
          metadataUserType = storedUserType;
          console.log('Retrieved user type from localStorage:', storedUserType);
        }
      }
      setUserAndCache(currentUser, metadataUserType ?? 'user');
    }
  };

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          setUser(null);
          setUserType(null);
          setIsEmailConfirmed(false);
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_user_type');
        } else if (session?.user) {
          await fetchUserAndSetType(session.user as User);
        } else {
          setUser(null);
          setUserType(null);
          setIsEmailConfirmed(false);
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_user_type');
        }
      } catch (error) {
        console.error('Session error:', error);
        setUser(null);
        setUserType(null);
        setIsEmailConfirmed(false);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_user_type');
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserAndSetType(session.user as User);
      } else {
        setUser(null);
        setUserType(null);
        setIsEmailConfirmed(false);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_user_type');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    userType: UserType,
    fullName?: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?confirmed=true`,
        },
      });

      if (error) {
        console.error('Signup error:', error);
        return { error };
      }

      if (data.user) {
        const profileInsert: any = {
          id: data.user.id,
          email,
          user_type: userType,
        };
        if (fullName) {
          profileInsert.full_name = fullName;
        }

        const { error: profileError } = await supabase.from('profiles').insert(profileInsert);

        if (profileError) {
          console.error('Error inserting profile:', profileError);
          return { error: profileError };
        }
      }

      return { error: null };
    } catch (err) {
      console.error('Signup error:', err);
      return { error: { message: 'An unexpected error occurred during signup' } as AuthError };
    }
  };

  const signIn = async (
    email: string,
    password: string,
    selectedUserType?: UserType
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          await supabase.auth.signOut();
          return {
            error: { message: 'Could not verify user type. Please try again later.' },
          };
        }

        if (selectedUserType && profile.user_type !== selectedUserType) {
          await supabase.auth.signOut();
          return {
            error: {
              message: `You are registered as "${profile.user_type.replace(
                '_',
                ' '
              )}" but tried to login as "${selectedUserType.replace('_', ' ')}". Please select the correct user type.`,
            },
          };
        }

        localStorage.setItem(`user_type_${data.user.id}`, selectedUserType ?? profile.user_type);
        setUserAndCache(data.user as User, selectedUserType ?? profile.user_type);
      }

      return { error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      return { error: { message: 'An unexpected error occurred during sign in' } as AuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserType(null);
    setIsEmailConfirmed(false);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_user_type');
  };

  return (
    <AuthContext.Provider
      value={{ user, userType, loading, signUp, signIn, signOut, isEmailConfirmed }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};