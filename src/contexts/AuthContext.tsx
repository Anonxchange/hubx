import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserType = 'user' | 'creator';

interface AuthContextType {
  user: User | null;
  userType: UserType | null;
  loading: boolean;
  signUp: (email: string, password: string, userType: UserType) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  isEmailConfirmed: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        // Check user_type metadata or fallback to profiles table
        const metadataUserType = session.user.user_metadata?.user_type as UserType | undefined;
        if (metadataUserType) setUserType(metadataUserType);
        else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', session.user.id)
            .single();

          setUserType((profile?.user_type as UserType) ?? 'user');
        }
        // Check if email confirmed
        setIsEmailConfirmed(Boolean(session.user.email_confirmed_at));
      } else {
        setIsEmailConfirmed(false);
      }

      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const metadataUserType = session.user.user_metadata?.user_type as UserType | undefined;
        if (metadataUserType) setUserType(metadataUserType);
        else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', session.user.id)
            .single();

          setUserType((profile?.user_type as UserType) ?? 'user');
        }
        setIsEmailConfirmed(Boolean(session.user.email_confirmed_at));
      } else {
        setUserType(null);
        setIsEmailConfirmed(false);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign up function with email confirmation redirect
  const signUp = async (email: string, password: string, userType: UserType) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: userType,
        },
        emailRedirectTo: window.location.origin + '/auth', // Redirect after email confirmation
      },
    });

    if (error) return { error };

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: data.user.id,
          user_type: userType,
        },
      ]);

      if (profileError) return { error: profileError };
    }

    return { error: null };
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  // Sign out function
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