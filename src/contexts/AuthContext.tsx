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
  app_metadata?: {
    user_type?: UserType;
  };
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

  /** Helper: update state and cache */
  const setUserAndCache = (currentUser: User, type: UserType) => {
    setUser(currentUser);
    setUserType(type);
    setIsEmailConfirmed(Boolean(currentUser.email_confirmed_at));

    localStorage.setItem('auth_user', JSON.stringify(currentUser));
    localStorage.setItem('auth_user_type', type);
  };

  /** Fetch user type from profile or fallback */
  const fetchUserAndSetType = async (currentUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', currentUser.id)
        .single();

      let finalType: UserType = 'user';

      if (!error && profile?.user_type) {
        finalType = profile.user_type as UserType;
      } else if (currentUser.user_metadata?.user_type) {
        finalType = currentUser.user_metadata.user_type;
      } else {
        const storedType = localStorage.getItem(`user_type_${currentUser.id}`) as UserType | null;
        if (storedType) finalType = storedType;
      }

      setUserAndCache(currentUser, finalType);
    } catch (err) {
      console.error('Error fetching user type:', err);
      const cachedType = localStorage.getItem('auth_user_type') as UserType;
      setUserAndCache(currentUser, cachedType || 'user');
    }
  };

  /** Restore cached user immediately for UI preview */
  useEffect(() => {
    const cachedUser = localStorage.getItem('auth_user');
    const cachedType = localStorage.getItem('auth_user_type') as UserType | null;
    if (cachedUser && cachedType) {
      try {
        const parsedUser = JSON.parse(cachedUser) as User;
        setUser(parsedUser);
        setUserType(cachedType);
        setIsEmailConfirmed(Boolean(parsedUser.email_confirmed_at));
        // do NOT set loading=false here
      } catch {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_user_type');
      }
    }
  }, []);

  /** Confirm session on mount */
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (session?.user) {
          await fetchUserAndSetType(session.user as User);
        } else {
          setUser(null);
          setUserType(null);
          setIsEmailConfirmed(false);
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_user_type');
        }
      } catch (err) {
        console.error('Session init error:', err);
        setUser(null);
        setUserType(null);
        setIsEmailConfirmed(false);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_user_type');
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      if (session?.user) {
        await fetchUserAndSetType(session.user as User);
      } else if (event === 'SIGNED_OUT') {
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

  /** Signup */
  const signUp = async (
    email: string,
    password: string,
    type: UserType,
    fullName?: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth?confirmed=true` },
      });

      if (error) return { error };

      if (data.user) {
        const profileInsert: any = { id: data.user.id, email, user_type: type };
        if (fullName) profileInsert.full_name = fullName;
        const { error: profileError } = await supabase.from('profiles').insert(profileInsert);
        if (profileError) return { error: profileError };
      }

      return { error: null };
    } catch (err) {
      console.error('Signup error:', err);
      return { error: { message: 'Unexpected error during signup' } as AuthError };
    }
  };

  /** Signin */
  const signIn = async (
    email: string,
    password: string,
    selectedUserType?: UserType
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };

      if (data.user) {
        if (!data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          return { error: { message: 'Email not confirmed. Check your inbox.' } };
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          await supabase.auth.signOut();
          return { error: { message: 'Could not verify user type. Try again.' } };
        }

        if (selectedUserType && profile.user_type !== selectedUserType) {
          await supabase.auth.signOut();
          return {
            error: {
              message: `You are registered as "${profile.user_type}" but tried to login as "${selectedUserType}".`,
            },
          };
        }

        localStorage.setItem(`user_type_${data.user.id}`, selectedUserType ?? profile.user_type);
        setUserAndCache(data.user as User, selectedUserType ?? profile.user_type);
      }

      return { error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      return { error: { message: 'Unexpected error during sign in' } as AuthError };
    }
  };

  /** Signout */
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