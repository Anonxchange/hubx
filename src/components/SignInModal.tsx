
import React, { useState } from 'react';
import { X, Crown, User, Eye } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose }) => {
  const [selectedUserType, setSelectedUserType] = useState<'member' | 'creator'>('member');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async () => {
    if (!username || !password) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Map the selected type to your auth system's user types
      const userType = selectedUserType === 'member' ? 'user' : 'individual_creator';
      
      const { error } = await signIn(username, password, userType);
      
      if (error) {
        alert(error.message);
      } else {
        onClose();
        // Optionally navigate somewhere after successful login
      }
    } catch (err) {
      alert('An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClick = () => {
    onClose();
    navigate('/auth');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-gray-900 text-white p-0 overflow-hidden rounded-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold">Sign in as</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Type Selection */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setSelectedUserType('member')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                selectedUserType === 'member'
                  ? 'border-yellow-500 bg-yellow-500/10'
                  : 'border-gray-600 bg-gray-800 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                <Crown className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-white">Member</h3>
                <p className="text-xs text-gray-400 mt-1">For members watching videos</p>
              </div>
            </button>

            <button
              onClick={() => setSelectedUserType('creator')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                selectedUserType === 'creator'
                  ? 'border-yellow-500 bg-yellow-500/10'
                  : 'border-gray-600 bg-gray-800 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                <User className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-white">Creator</h3>
                <p className="text-xs text-gray-400 mt-1">For producers, studios, content-creators</p>
              </div>
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Username/Email Input */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Username / Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white pl-10 py-3 rounded-lg focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
              </svg>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white pl-10 pr-10 py-3 rounded-lg focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                  className="border-gray-600"
                />
                <label htmlFor="remember" className="text-sm text-gray-300">
                  Remember me
                </label>
              </div>
              <button className="text-sm text-blue-400 hover:text-blue-300">
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <Button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>

            {/* Google Sign In */}
            <Button
              variant="outline"
              className="w-full bg-white hover:bg-gray-100 text-gray-800 border-gray-300 py-3 rounded-lg"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </Button>

            {/* Join Link */}
            <div className="text-center">
              <span className="text-gray-400 text-sm">Not yet a member? </span>
              <button 
                onClick={handleJoinClick}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignInModal;
