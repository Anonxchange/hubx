import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

type UserType = 'user' | 'creator';

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

  const fetchUserAndSetType = async (currentUser: User) => {
    setUser(currentUser);
    const metadataUserType = currentUser.user_metadata?.user_type as UserType | undefined;
    if (metadataUserType) {
      setUserType(metadataUserType);
    } else {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', currentUser.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
        }
        setUserType((profile?.user_type as UserType) ?? 'user');
      } catch (profileError) {
        console.error('Profile fetch error:', profileError);
        setUserType('user');
      }
    }
    setIsEmailConfirmed(Boolean(currentUser.email_confirmed_at));
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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

  // Sign up function with email confirmation redirect
  const signUp = async (email: string, password: string, userType: UserType) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType,
          },
          emailRedirectTo: window.location.origin + '/auth',
        },
      });

      if (error) {
        console.error('Signup error:', error);
        return { error };
      }

      // If email confirmation is required, we don't immediately create the profile.
      // The profile creation will be handled after email confirmation or on first login.
      if (data.user && !data.user.email_confirmed_at) {
        return { error: null };
      }

      // If user is created and email is already confirmed (e.g., during testing or specific configurations)
      if (data.user) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (!existingProfile) {
          const { error: profileError } = await supabase.from('profiles').upsert([
            {
              id: data.user.id,
              user_type: userType,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);

          if (profileError) {
            console.error('Profile creation error:', profileError);
            return { error: profileError };
          }
        }
      }

      return { error: null };
    } catch (err) {
      console.error('Signup error:', err);
      return { error: { message: 'An unexpected error occurred during signup' } as AuthError };
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // The user state and type will be updated by the onAuthStateChange listener
      // after a successful sign-in.
      return { error };
    } catch (err) {
      console.error('Sign in error:', err);
      return { error: { message: 'An unexpected error occurred during sign in' } as AuthError };
    }
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
};efined;
        if (metadataUserType) {
          setUserType(metadataUserType);
        } else {
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('user_type')
              .eq('id', session.user.id)
              .single();

            if (error && error.code !== 'PGRST116') {
              console.error('Error fetching profile:', error);
            }

            setUserType((profile?.user_type as UserType) ?? 'user');
          } catch (profileError) {
            console.error('Profile fetch error:', profileError);
            setUserType('user');
          }
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
    try {
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

      if (data.user && !data.user.email_confirmed_at) {
        // User needs to confirm email, don't create profile yet
        return { error: null };
      }

      if (data.user) {
        // Check if profile already exists before inserting
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (!existingProfile) {
          const { error: profileError } = await supabase.from('profiles').upsert([
            {
              id: data.user.id,
              user_type: userType,
            },
          ]);

          if (profileError) {
            console.error('Profile creation error:', profileError);
            return { error: profileError };
          }
        }
      }

      return { error: null };
    } catch (err) {
      console.error('Signup error:', err);
      return { error: { message: 'An unexpected error occurred during signup' } as AuthError };
    }
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