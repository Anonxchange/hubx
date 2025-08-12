
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VerificationBadgeProps {
  userType: 'individual_creator' | 'studio_creator' | 'user' | 'admin';
  className?: string;
  showText?: boolean;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({ 
  userType, 
  className = "", 
  showText = false 
}) => {
  const isCreator = userType === 'individual_creator' || userType === 'studio_creator';
  
  if (!isCreator) return null;

  return (
    <Badge 
      variant="secondary" 
      className={`bg-blue-500 hover:bg-blue-600 text-white ${className}`}
    >
      <CheckCircle className="w-3 h-3 mr-1" />
      {showText && (userType === 'individual_creator' ? 'Verified Creator' : 'Verified Studio')}
    </Badge>
  );
};

export default VerificationBadge;
