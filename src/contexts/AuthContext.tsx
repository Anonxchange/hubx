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

  // Fetch profile and set userType & email confirmation state
  const fetchUserAndSetType = async (currentUser: User) => {
    setUser(currentUser);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', currentUser.id)
      .single();

    if (!error && profile?.user_type) {
      setUserType(profile.user_type as UserType);
    } else {
      // Fallback: check user_metadata or localStorage
      let metadataUserType = currentUser.user_metadata?.user_type as UserType | undefined;
      if (!metadataUserType) {
        const storedUserType = localStorage.getItem(`user_type_${currentUser.id}`) as UserType | null;
        if (storedUserType) {
          metadataUserType = storedUserType;
          console.log('Retrieved user type from localStorage:', storedUserType);
        }
      }
      setUserType(metadataUserType ?? 'user');
    }

    setIsEmailConfirmed(Boolean(currentUser.email_confirmed_at));
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
        } else if (session?.user) {
          await fetchUserAndSetType(session.user as User);
        } else {
          setUser(null);
          setUserType(null);
          setIsEmailConfirmed(false);
        }
      } catch (error) {
        console.error('Session error:', error);
        setUser(null);
        setUserType(null);
        setIsEmailConfirmed(false);
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
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign up user and create profile with userType and optional fullName
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

  // Sign in user and optionally store userType in localStorage as fallback
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

      if (selectedUserType && data.user) {
        localStorage.setItem(`user_type_${data.user.id}`, selectedUserType);
        console.log('Updated user type during login:', selectedUserType);
      }

      return { error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      return { error: { message: 'An unexpected error occurred during sign in' } as AuthError };
    }
  };

  // Sign out user and clear local state
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserType(null);
    setIsEmailConfirmed(false);
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