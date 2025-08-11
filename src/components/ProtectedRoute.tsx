import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  allowedUserTypes: string[];
  children: React.ReactElement;
}

const ProtectedRoute = ({ allowedUserTypes, children }: ProtectedRouteProps) => {
  const { userType, loading } = useAuth();

  if (loading) {
    // Show loading indicator while auth status is loading
    return <div>Loading...</div>;
  }

  if (!userType || !allowedUserTypes.includes(userType)) {
    // If user not allowed or not logged in, redirect to /auth (login page)
    return <Navigate to="/auth" replace />;
  }

  // User is allowed, render the protected component
  return children;
};

export default ProtectedRoute;