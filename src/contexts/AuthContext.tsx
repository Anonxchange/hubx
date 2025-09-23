import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { profileService } from '@/services/profileService';

export type UserType = 'user' | 'individual_creator' | 'studio_creator';

interface UserProfileData {
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
  user: UserProfileData | null;
  userType: UserType | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, userType: UserType) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string, selectedUserType?: UserType, twoFactorCode?: string) => Promise<{ error: AuthError | null; requires2FA?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  refreshUserData: () => Promise<void>;
}

// Cache keys
const USER_CACHE_KEY = 'hubx_user_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache the session to avoid repeated requests
let sessionCache: { user: UserProfileData | null; userType: UserType | null; timestamp: number } | null = null;
const SESSION_CACHE_DURATION = 30000; // 30 seconds

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache utilities
const getCachedUser = (): { user: UserProfileData | null; userType: UserType | null; timestamp: number } | null => {
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (error) {
    console.error('Error reading user cache:', error);
  }
  return null;
};

const setCachedUser = (user: UserProfileData | null, userType: UserType | null) => {
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify({
      user,
      userType,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Error setting user cache:', error);
  }
};

const clearCachedUser = () => {
  try {
    localStorage.removeItem(USER_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing user cache:', error);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<UserProfileData | null>(null);

  // Update userRef when user changes
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Helper to update user state and cache in localStorage
  const setUserAndCache = useCallback((userData: UserProfileData | null, userType: UserType | null) => {
    setUser(userData);
    setUserType(userType);
    setCachedUser(userData, userType);

    // Update session cache immediately
    sessionCache = {
      user: userData,
      userType: userType,
      timestamp: Date.now()
    };

    // Legacy cache support
    try {
      if (userType) {
        localStorage.setItem('userType', userType);
      }
    } catch (error) {
      console.error('Error caching user type:', error);
    }
  }, []);

  const fetchUserAndSetType = useCallback(async (currentUser: User) => {
    // Prevent multiple calls for the same user with stronger validation
    if (userRef.current?.id === currentUser.id && userRef.current?.email === currentUser.email && userType) {
      console.log('Skipping fetchUserAndSetType - user already loaded');
      return;
    }

    console.log('fetchUserAndSetType called for user:', currentUser.id);

    // Check if we have a very recent cache (within 5 minutes) to avoid unnecessary DB calls
    const cachedUserType = localStorage.getItem(`user_type_${currentUser.id}`) as UserType | null;
    const lastFetchTime = localStorage.getItem(`last_fetch_${currentUser.id}`);
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

    if (cachedUserType && lastFetchTime && parseInt(lastFetchTime) > fiveMinutesAgo) {
      console.log('Using recent cached user type:', cachedUserType);
      setUserAndCache(currentUser as UserProfileData, cachedUserType);
      setLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', currentUser.id)
        .single();

      console.log('Profile fetch result:', { profile, error });

      if (!error && profile?.user_type) {
        console.log('Setting user type from profile:', profile.user_type);
        localStorage.setItem(`last_fetch_${currentUser.id}`, Date.now().toString());
        setUserAndCache(currentUser as UserProfileData, profile.user_type as UserType);
      } else {
        // Try multiple sources for user type in order of preference
        let metadataUserType = currentUser.user_metadata?.user_type as UserType | undefined;
        console.log('User metadata type:', metadataUserType);

        // Check localStorage for this specific user
        if (!metadataUserType && cachedUserType) {
          metadataUserType = cachedUserType;
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

        // Only create/update profile if we don't have a cached type or it's different
        if (finalUserType !== 'user' && finalUserType !== cachedUserType) {
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

        localStorage.setItem(`last_fetch_${currentUser.id}`, Date.now().toString());
        setUserAndCache(currentUser as UserProfileData, finalUserType);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Try to get from localStorage as last resort
      const fallbackUserType = cachedUserType || 'user';
      console.log('Using fallback user type:', fallbackUserType);
      setUserAndCache(currentUser as UserProfileData, fallbackUserType);
    } finally {
      setLoading(false);
    }
  }, [setUserAndCache]);

  const fetchUserProfile = useCallback(async (currentUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', currentUser.id)
        .single();

      if (!error && profile?.user_type) {
        setUserAndCache(currentUser as UserProfileData, profile.user_type as UserType);
      } else {
        // Fallback to metadata or default if profile fails
        const metadataUserType = currentUser.user_metadata?.user_type as UserType || currentUser.app_metadata?.user_type as UserType || 'user';
        setUserAndCache(currentUser as UserProfileData, metadataUserType);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to metadata or default if fetch fails
      const metadataUserType = currentUser.user_metadata?.user_type as UserType || currentUser.app_metadata?.user_type as UserType || 'user';
      setUserAndCache(currentUser as UserProfileData, metadataUserType);
    }
  }, [setUserAndCache]);

  const refreshUserData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    let mounted = true;
    let initialized = false;
    let isProcessingAuth = false;

    const initializeAuth = async () => {
      if (isProcessingAuth) return;
      isProcessingAuth = true;

      try {
        // Check localStorage cache first - this should be instant
        const cachedData = getCachedUser();
        if (cachedData?.user && cachedData?.userType) {
          setUser(cachedData.user);
          setUserType(cachedData.userType);
          setLoading(false);
          initialized = true;
          
          // Update session cache
          sessionCache = {
            user: cachedData.user,
            userType: cachedData.userType,
            timestamp: Date.now()
          };
          
          // Silently verify session in background without blocking UI
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user && session.user.id === cachedData.user?.id) {
              // Session is valid, no need to update
            } else {
              // Session invalid, re-authenticate silently
              if (mounted) {
                setUser(null);
                setUserType(null);
                clearCachedUser();
                sessionCache = null;
              }
            }
          }).catch(() => {
            // Ignore background verification errors
          });
          
          isProcessingAuth = false;
          return;
        }

        // No cache available, get session
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted && session?.user) {
          await fetchUserAndSetType(session.user);
          initialized = true;
        } else if (mounted) {
          setUser(null);
          setUserType(null);
          setLoading(false);
          initialized = true;
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setUserType(null);
          setLoading(false);
          initialized = true;
        }
      } finally {
        isProcessingAuth = false;
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted || isProcessingAuth) return;

      // Skip ALL INITIAL_SESSION events after we've initialized to prevent loops
      if (event === 'INITIAL_SESSION') {
        if (initialized) {
          console.log('Skipping duplicate INITIAL_SESSION - already initialized');
          return;
        }
        
        // Only process the first INITIAL_SESSION
        initialized = true;
        isProcessingAuth = true;
        
        try {
          if (session?.user) {
            console.log('Processing first INITIAL_SESSION');
            await fetchUserAndSetType(session.user);
          } else {
            setUser(null);
            setUserType(null);
            setLoading(false);
          }
        } finally {
          isProcessingAuth = false;
        }
        return;
      }

      console.log('Auth state change:', event, session?.user?.id);

      if (event === 'SIGNED_IN') {
        // Only process SIGNED_IN if we don't already have the user loaded
        if (session?.user && !isProcessingAuth && (!user || user.id !== session.user.id)) {
          isProcessingAuth = true;
          try {
            await fetchUserAndSetType(session.user);
          } finally {
            isProcessingAuth = false;
          }
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Skip TOKEN_REFRESHED if user is already loaded - no need to refetch
        if (!user || !session?.user) {
          console.log('Processing TOKEN_REFRESHED - user not loaded');
          if (session?.user && !isProcessingAuth) {
            isProcessingAuth = true;
            try {
              await fetchUserAndSetType(session.user);
            } finally {
              isProcessingAuth = false;
            }
          }
        } else {
          console.log('Skipping TOKEN_REFRESHED - user already loaded');
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserType(null);
        clearCachedUser();
        sessionCache = null;
        setLoading(false);
        initialized = false;
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
          await profileService.createProfile({
            id: data.user.id,
            email: data.user.email || '',
            userType: userType,
            fullName: fullName
          });
          console.log('Profile created successfully with userType:', userType);

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
          setUserAndCache(data.user as UserProfileData, userType);
          sessionCache = { // Update session cache
            user: data.user as UserProfileData,
            userType: userType,
            timestamp: Date.now()
          };
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
    selectedUserType?: UserType,
    twoFactorCode?: string
  ): Promise<{ error: AuthError | null; requires2FA?: boolean }> => {
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
          .select('user_type, two_factor_enabled, two_factor_secret')
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

        // Check if 2FA is enabled and verify code if provided
        if (profile.two_factor_enabled && profile.two_factor_secret) {
          if (!twoFactorCode) {
            // Sign out the user and require 2FA
            await supabase.auth.signOut();
            return { error: null, requires2FA: true };
          }

          // Verify 2FA code
          try {
            const { Secret, TOTP } = await import('otpauth');
            const secret = Secret.fromBase32(profile.two_factor_secret);
            const totp = new TOTP({
              issuer: 'HubX Video Platform',
              label: data.user.email || 'HubX User',
              algorithm: 'SHA1',
              digits: 6,
              period: 30,
              secret: secret,
            });

            const delta = totp.validate({
              token: twoFactorCode,
              window: 1,
            });

            if (delta === null) {
              await supabase.auth.signOut();
              return {
                error: {
                  message: 'Invalid 2FA code. Please check your authenticator app and try again.',
                },
              };
            }
          } catch (twoFactorError) {
            console.error('2FA verification error:', twoFactorError);
            await supabase.auth.signOut();
            return {
              error: {
                message: 'Failed to verify 2FA code. Please try again.',
              },
            };
          }
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
        setUserAndCache(data.user as UserProfileData, correctUserType);

        // Update session cache on successful sign-in
        sessionCache = {
          user: data.user as UserProfileData,
          userType: correctUserType,
          timestamp: Date.now()
        };
      }

      return { error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      return { error: { message: 'An unexpected error occurred during sign in' } as AuthError };
    }
  };

  // Signout function
  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setUserType(null);
      clearCachedUser();
      sessionCache = null; // Clear session cache on sign out
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  // Forgot password function
  const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
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
    <AuthContext.Provider value={{
      user,
      userType,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
      refreshUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};