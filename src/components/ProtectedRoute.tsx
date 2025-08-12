import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  allowedUserTypes?: string[];
  requiredUserType?: string[];
  children: React.ReactElement;
}

const ProtectedRoute = ({ allowedUserTypes, requiredUserType, children }: ProtectedRouteProps) => {
  const { user, userType, loading } = useAuth();

  // Use either allowedUserTypes or requiredUserType (for backwards compatibility)
  const validUserTypes = allowedUserTypes || requiredUserType || [];

  console.log('ProtectedRoute Debug:', {
    user: user?.id || 'No user',
    userType,
    loading,
    validUserTypes,
    userMetadata: user?.user_metadata,
    localStorageUserType: localStorage.getItem('auth_user_type'),
    localStorageUser: localStorage.getItem('auth_user')
  });

  if (loading) {
    // Show loading indicator while auth status is loading
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If no user is logged in, redirect to auth
  if (!user) {
    console.log('No user logged in, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // If user doesn't have the required user type, show access denied
  if (!userType || !validUserTypes.includes(userType)) {
    console.log('User type not allowed:', { userType, validUserTypes });
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
          <p className="text-muted-foreground mb-6">
            This page is only available to {validUserTypes.join(' and ')} accounts.
            {!userType && " Please complete your profile setup."}
          </p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.href = '/auth'}
              className="block w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Sign In / Sign Up
            </button>
            <button 
              onClick={() => window.location.href = '/become-model'}
              className="block w-full px-4 py-2 border border-border rounded hover:bg-muted"
            >
              Become a Creator
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is allowed, render the protected component
  return children;
};

export default ProtectedRoute;