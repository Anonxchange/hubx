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
  forgotPassword: (email: string) => Promise<{ error: AuthError | null }>;
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
        // Try multiple sources for user type in order of preference
        let metadataUserType = currentUser.user_metadata?.user_type as UserType | undefined;
        console.log('User metadata type:', metadataUserType);

        // Check localStorage for this specific user
        if (!metadataUserType) {
          const storedUserType = localStorage.getItem(`user_type_${currentUser.id}`) as UserType | null;
          console.log('Stored user type:', storedUserType);
          if (storedUserType) {
            metadataUserType = storedUserType;
          }
        }

        // Check for temp signup data (for users who just signed up)
        if (!metadataUserType && currentUser.email) {
          const tempUserType = localStorage.getItem(`temp_signup_usertype_${currentUser.email}`) as UserType | null;
          console.log('Temp signup user type:', tempUserType);
          if (tempUserType) {
            metadataUserType = tempUserType;
            // Store it permanently and clean up temp
            localStorage.setItem(`user_type_${currentUser.id}`, tempUserType);
            localStorage.removeItem(`temp_signup_usertype_${currentUser.email}`);
          }
        }

        // Check app_metadata as final fallback before defaulting to 'user'
        if (!metadataUserType) {
          metadataUserType = currentUser.app_metadata?.user_type as UserType | undefined;
          console.log('App metadata user type:', metadataUserType);
        }

        const finalUserType = metadataUserType || 'user';
        console.log('Setting final user type:', finalUserType);

        // Create or update profile if we have a non-default user type
        if (finalUserType !== 'user') {
          console.log('Creating/updating profile with user type:', finalUserType);
          try {
            await profileService.createProfile({
              id: currentUser.id,
              email: currentUser.email || '',
              userType: finalUserType,
              fullName: currentUser.user_metadata?.first_name && currentUser.user_metadata?.last_name 
                ? `${currentUser.user_metadata.first_name} ${currentUser.user_metadata.last_name}`
                : currentUser.user_metadata?.first_name || ''
            });
          } catch (createError) {
            console.log('Profile already exists, trying to update:', createError);
            await profileService.updateProfile(currentUser.id, { userType: finalUserType });
          }
        }

        setUserAndCache(currentUser, finalUserType);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Try to get from localStorage as last resort
      const storedUserType = localStorage.getItem(`user_type_${currentUser.id}`) as UserType;
      const fallbackUserType = storedUserType || 'user';
      console.log('Using fallback user type:', fallbackUserType);
      setUserAndCache(currentUser, fallbackUserType);
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
      // Store the user type immediately before signup
      const tempUserTypeKey = `temp_signup_usertype_${email}`;
      localStorage.setItem(tempUserTypeKey, userType);
      console.log('Stored temporary user type for signup:', userType);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?confirmed=true`,
          data: {
            user_type: userType, // Include in auth metadata
            full_name: fullName
          }
        },
      });

      if (error) {
        console.error('Signup error:', error);
        // Clean up temp storage on error
        localStorage.removeItem(tempUserTypeKey);
        return { error };
      }

      if (data.user) {
        console.log('Signup successful, creating profile with userType:', userType);

        // Store user type with user ID for future reference
        localStorage.setItem(`user_type_${data.user.id}`, userType);
        
        // Try to create profile immediately
        try {
          const profileCreated = await profileService.createProfile({
            id: data.user.id,
            email: data.user.email || '',
            userType: userType,
            fullName: fullName
          });

          if (profileCreated) {
            console.log('Profile created successfully with userType:', userType);
          } else {
            console.error('Failed to create user profile - will retry later');
          }
        } catch (profileError) {
          console.error('Profile creation error:', profileError);
          // If profile creation fails, try direct database insert
          try {
            await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                email: data.user.email || '',
                user_type: userType,
                full_name: fullName
              });
            console.log('Profile created via direct database insert with user_type:', userType);
          } catch (directInsertError) {
            console.error('Direct profile creation also failed:', directInsertError);
          }
        }

        // Clean up temp storage
        localStorage.removeItem(tempUserTypeKey);

        // If user is immediately logged in (rare but possible), set the context
        if (data.session) {
          console.log('User is immediately logged in, setting user type in context');
          setUserAndCache(data.user as User, userType);
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

        console.log('Profile fetch for signin:', { profile, profileError, userId: data.user.id });

        if (profileError) {
          console.error('Profile error details:', profileError);
          await supabase.auth.signOut();
          return {
            error: { message: 'Could not verify user type. Please try again later.' },
          };
        }

        console.log('Database user_type:', profile.user_type, 'Selected user_type:', selectedUserType);

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

        // Use the profile user_type (from database) as the source of truth
        const correctUserType = profile.user_type as UserType;
        localStorage.setItem(`user_type_${data.user.id}`, correctUserType);
        setUserAndCache(data.user as User, correctUserType);
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

  // Forgot password function
  const forgotPassword = async (email: string): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (err) {
      console.error('Forgot password error:', err);
      return { error: { message: 'An unexpected error occurred while sending reset email' } as AuthError };
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, userType, loading, signUp, signIn, signOut, forgotPassword, isEmailConfirmed }}
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