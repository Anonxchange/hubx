import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, Globe } from 'lucide-react';

interface AgeGateWrapperProps {
  children: React.ReactNode;
}

const AgeGateWrapper: React.FC<AgeGateWrapperProps> = ({ children }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const ageVerified = localStorage.getItem('ageVerified');
    if (ageVerified === 'true') {
      setIsVerified(true);
    } else {
      const timer = setTimeout(() => setShowModal(true), 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnter = () => {
    localStorage.setItem('ageVerified', 'true');
    setIsVerified(true);
    setShowModal(false);
  };

  const handleExit = () => {
    window.location.href = 'https://www.google.com';
  };

  if (isVerified) {
    return <>{children}</>;
  }

  if (!showModal) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    {/* 🔥 Background fixed like Pornhub: no blur, just semi-transparent black */}
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Language Selector */}
        <div className="mb-6 flex justify-start">
          <div className="flex items-center space-x-2 bg-white/10 rounded-md px-3 py-2 text-white">
            <Globe className="w-4 h-4 text-gray-300" />
            <span className="text-sm">English</span>
            <ChevronDown className="w-4 h-4 text-gray-300" />
          </div>
        </div>

        {/* Solid black card */}
        <Card className="bg-black border border-gray-700 shadow-2xl rounded-md">
          <CardContent className="p-8 text-center space-y-6">
            {/* Logo */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="gradient-overlay rounded-lg p-2">
                <span className="text-2xl font-bold text-white">HubX</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-white mb-4">
              This is an adult website
            </h1>

            {/* Main Content */}
            <div className="text-gray-200 text-sm leading-relaxed space-y-4">
              <p>
                This website contains age-restricted materials including nudity and explicit 
                depictions of sexual activity. By entering, you affirm that you are at 
                least 18 years of age or the age of majority in the jurisdiction you are 
                accessing the website from and you consent to viewing sexually explicit content.
              </p>

              <p>
                Our Terms are changing. These changes will or have come into effect on{' '}
                <span className="font-semibold text-white">30 June 2025</span>. To see the 
                updated changes, please see our{' '}
                <span className="text-orange-400 font-semibold">New Terms of Service</span>.
              </p>
            </div>

            {/* Buttons */}
            <div className="space-y-3 pt-6">
              <Button 
                onClick={handleEnter}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 text-base rounded-md transition-colors"
              >
                I am 18 or older - Enter
              </Button>

              <Button 
                onClick={handleExit}
                variant="secondary"
                className="w-full bg-gray-700/80 hover:bg-gray-600 text-white font-semibold py-3 text-base rounded-md transition-colors"
              >
                I am under 18 - Exit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgeGateWrapper;