import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { profileService } from '@/services/profileService';

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

  // Restore user info from localStorage immediately to prevent UI flash
  useEffect(() => {
    const cachedUser = localStorage.getItem('auth_user');
    const cachedUserType = localStorage.getItem('auth_user_type') as UserType | null;

    if (cachedUser && cachedUserType) {
      try {
        const parsedUser = JSON.parse(cachedUser) as User;
        setUser(parsedUser);
        setUserType(cachedUserType);
        setIsEmailConfirmed(Boolean(parsedUser.email_confirmed_at));
        // Keep loading true until session is verified by getSession
      } catch (err) {
        console.error('Error parsing cached user:', err);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_user_type');
        setLoading(false); // Set loading to false if cache is invalid
      }
    } else {
      // No cached data, we'll wait for getSession to complete
      setLoading(true);
    }
  }, []);

  // Helper to update user state and cache in localStorage
  const setUserAndCache = (currentUser: User, type: UserType) => {
    setUser(currentUser);
    setUserType(type);
    setIsEmailConfirmed(Boolean(currentUser.email_confirmed_at));

    localStorage.setItem('auth_user', JSON.stringify(currentUser));
    localStorage.setItem('auth_user_type', type);
  };

  // Fetch user profile to get user_type, then set in state and localStorage
  const fetchUserAndSetType = async (currentUser: User) => {
    console.log('fetchUserAndSetType called for user:', currentUser.id);

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', currentUser.id)
        .single();

      console.log('Profile fetch result:', { profile, error });

      if (!error && profile?.user_type) {
        console.log('Setting user type from profile:', profile.user_type);
        setUserAndCache(currentUser, profile.user_type as UserType);
      } else {
        let metadataUserType = currentUser.user_metadata?.user_type as UserType | undefined;
        console.log('User metadata type:', metadataUserType);

        if (!metadataUserType) {
          const storedUserType = localStorage.getItem(`user_type_${currentUser.id}`) as UserType | null;
          if (storedUserType) {
            metadataUserType = storedUserType;
            console.log('Retrieved user type from localStorage:', storedUserType);
          }
        }

        const finalUserType = metadataUserType ?? 'user';
        console.log('Setting final user type:', finalUserType);
        setUserAndCache(currentUser, finalUserType);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to cached or default user type
      const cachedUserType = localStorage.getItem('auth_user_type') as UserType;
      setUserAndCache(currentUser, cachedUserType || 'user');
    }
  };

  // On component mount, get session and subscribe to auth state changes
  useEffect(() => {
    let isInitialLoad = true;

    const getSession = async () => {
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
          // If we have cached data and it matches the session user, don't refetch
          const cachedUser = localStorage.getItem('auth_user');
          const cachedUserType = localStorage.getItem('auth_user_type');

          if (cachedUser && cachedUserType && isInitialLoad) {
            try {
              const parsedUser = JSON.parse(cachedUser) as User;
              if (parsedUser.id === session.user.id) {
                // User data is already set from cache, just verify it's still valid
                console.log('Using cached user data for session verification');
                // Ensure email confirmation status is up to date
                setIsEmailConfirmed(Boolean(session.user.email_confirmed_at));
                setLoading(false);
                return;
              }
            } catch (err) {
              console.error('Error parsing cached user during session check:', err);
              // Clear invalid cache
              localStorage.removeItem('auth_user');
              localStorage.removeItem('auth_user_type');
            }
          }

          await fetchUserAndSetType(session.user as User);
        } else {
          // No session, clear everything
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
        isInitialLoad = false;
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      setLoading(true);

      if (session?.user) {
        // Always fetch user type on auth state changes (login, token refresh, etc.)
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
  }, []); // Remove dependencies to prevent infinite loops

  // Signup function
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
        // Check if profile exists first, create only if it doesn't
        const existingProfile = await profileService.getProfile(data.user.id);

        if (!existingProfile) {
          const profileCreated = await profileService.createProfile({
            id: data.user.id,
            email: data.user.email || '',
            userType: userType
          });

          if (!profileCreated) {
            console.error('Failed to create user profile');
            // Don't throw error here as the user account was created successfully
          }
        }
      }

      return { error: null };
    } catch (err) {
      console.error('Signup error:', err);
      return { error: { message: 'An unexpected error occurred during signup' } as AuthError };
    }
  };

  // Signin function with email confirmation check
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
        // Email confirmation check
        if (!data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          return {
            error: {
              message: 'Email not confirmed. Please check your inbox and verify your email.',
            },
          };
        }

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

  // Signout function
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