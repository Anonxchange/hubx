
import { useState, useEffect } from 'react';
import { adBlockerDetector } from '../utils/adBlockerUtils';

export const useAdBlockDetection = () => {
  const [isAdBlockActive, setIsAdBlockActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectAdBlock = async () => {
      try {
        const detected = await adBlockerDetector.detectAdBlocker();
        setIsAdBlockActive(detected);
      } catch (error) {
        console.error('Ad block detection failed:', error);
        setIsAdBlockActive(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Delay detection to ensure page is loaded
    const timer = setTimeout(detectAdBlock, 1000);
    return () => clearTimeout(timer);
  }, []);

  return { isAdBlockActive, isLoading };
};
