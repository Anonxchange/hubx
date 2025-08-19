import React from 'react';
import { CheckCircle, Tv } from 'lucide-react'; // Changed Shield to Tv for channel badge
import { Badge } from '@/components/ui/badge';

interface VerificationBadgeProps {
  userType: 'individual_creator' | 'studio_creator' | 'user' | 'admin';
  className?: string;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  userType,
  className = "",
  showText = false,
  size = 'medium'
}) => {
  const isCreator = userType === 'individual_creator' || userType === 'studio_creator';

  if (!isCreator) return null;

  const badgeConfig = {
    individual_creator: {
      text: 'Verified Creator',
      bgColor: 'bg-blue-500 hover:bg-blue-600',
      ringColor: 'ring-blue-400/20'
    },
    studio_creator: {
      text: 'Verified Channel',
      bgColor: 'bg-purple-500 hover:bg-purple-600',
      ringColor: 'ring-purple-400/20'
    }
  };

  const config = badgeConfig[userType];

  const getBadgeStyle = () => {
    if (userType === 'individual_creator') {
      return 'bg-blue-500 text-white';
    } else if (userType === 'studio_creator') {
      return 'bg-purple-500 text-white';
    }
    return 'bg-gray-500 text-white';
  };

  const getBadgeIcon = () => {
    const iconSize = size === 'small' ? 'h-2.5 w-2.5' : size === 'large' ? 'h-4 w-4' : 'h-3 w-3';

    if (userType === 'individual_creator') {
      return <CheckCircle className={iconSize} />;
    } else if (userType === 'studio_creator') {
      return <Tv className={iconSize} />;
    }
    return <CheckCircle className={iconSize} />;
  };

  const getBadgeSize = () => {
    if (size === 'small') return 'px-1.5 py-0.5 text-xs';
    if (size === 'large') return 'px-3 py-1.5 text-sm';
    return 'px-2 py-1 text-xs';
  };

  const getBadgeText = () => {
    return showText ? config.text : '';
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${getBadgeStyle()} ${getBadgeSize()} ${className}`}>
      {getBadgeIcon()}
      {getBadgeText()}
    </span>
  );
};

export default VerificationBadge;