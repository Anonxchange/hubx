
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DebugAuth = () => {
  const { user, userType, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Auth Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">User ID:</h3>
            <p className="text-sm text-muted-foreground">{user?.id || 'Not logged in'}</p>
          </div>
          
          <div>
            <h3 className="font-semibold">User Type:</h3>
            <p className="text-sm text-muted-foreground">{userType || 'No user type set'}</p>
          </div>
          
          <div>
            <h3 className="font-semibold">User Metadata:</h3>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(user?.user_metadata, null, 2)}
            </pre>
          </div>
          
          <div>
            <h3 className="font-semibold">App Metadata:</h3>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(user?.app_metadata, null, 2)}
            </pre>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={() => window.location.href = '/upload'}
              disabled={!user}
            >
              Test Upload Page Access
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/video/test-id'}
              variant="outline"
            >
              Test Video Page Access
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugAuth;
