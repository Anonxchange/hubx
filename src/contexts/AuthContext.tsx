import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        if (session?.user) {
          // Check user_type metadata or fallback to profiles table
          const metadataUserType = session.user.user_metadata?.user_type as UserType | undefined;
          if (metadataUserType) {
            setUserType(metadataUserType);
          } else {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('user_type')
                .eq('id', session.user.id)
                .single();

              if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error fetching profile:', error);
              }

              setUserType((profile?.user_type as UserType) ?? 'user');
            } catch (profileError) {
              console.error('Profile fetch error:', profileError);
              setUserType('user'); // Default fallback
            }
          }
          // Check if email confirmed
          setIsEmailConfirmed(Boolean(session.user.email_confirmed_at));
        } else {
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
      setUser(session?.user ?? null);

      if (session?.user) {
        const metadataUserType = session.user.user_metadata?.user_type as UserType | undefined;
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