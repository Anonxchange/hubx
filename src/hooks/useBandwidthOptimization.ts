import { useState, useEffect } from 'react';

interface ConnectionInfo {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface BandwidthSettings {
  videoQuality: 'low' | 'medium' | 'high';
  imageFormat: 'webp' | 'jpg';
  preloadStrategy: 'none' | 'metadata' | 'auto';
  dataSaverMode: boolean;
}

export const useBandwidthOptimization = () => {
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [settings, setSettings] = useState<BandwidthSettings>({
    videoQuality: 'medium',
    imageFormat: 'webp',
    preloadStrategy: 'none',
    dataSaverMode: false
  });

  useEffect(() => {
    // Check for Network Information API
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      const updateConnectionInfo = () => {
        setConnectionInfo({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });
      };

      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);

      return () => {
        connection.removeEventListener('change', updateConnectionInfo);
      };
    }
  }, []);

  useEffect(() => {
    if (connectionInfo) {
      // Auto-adjust settings based on connection
      const newSettings: BandwidthSettings = {
        videoQuality: 'medium',
        imageFormat: 'webp',
        preloadStrategy: 'none',
        dataSaverMode: connectionInfo.saveData
      };

      // Adjust based on connection speed
      if (connectionInfo.effectiveType === 'slow-2g' || connectionInfo.effectiveType === '2g') {
        newSettings.videoQuality = 'low';
        newSettings.preloadStrategy = 'none';
        newSettings.dataSaverMode = true;
      } else if (connectionInfo.effectiveType === '3g') {
        newSettings.videoQuality = 'medium';
        newSettings.preloadStrategy = 'none';
      } else if (connectionInfo.effectiveType === '4g' && connectionInfo.downlink > 10) {
        newSettings.videoQuality = 'high';
        newSettings.preloadStrategy = 'metadata';
      }

      // Check if browser supports WebP
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      newSettings.imageFormat = supportsWebP ? 'webp' : 'jpg';

      setSettings(newSettings);
    }
  }, [connectionInfo]);

  const getOptimizedImageUrl = (originalUrl: string, width?: number, height?: number) => {
    if (!originalUrl) return originalUrl;
    
    // If it's a CDN URL that supports resizing
    if (originalUrl.includes('bunnycdn.com') || originalUrl.includes('b-cdn.net')) {
      let optimizedUrl = originalUrl;
      
      if (width && height) {
        optimizedUrl += `?width=${width}&height=${height}`;
      }
      
      if (settings.imageFormat === 'webp') {
        optimizedUrl += width && height ? '&format=webp' : '?format=webp';
      }
      
      return optimizedUrl;
    }
    
    return originalUrl;
  };

  const getVideoPreloadStrategy = () => {
    return settings.dataSaverMode ? 'none' : settings.preloadStrategy;
  };

  const shouldLoadPreview = () => {
    return !settings.dataSaverMode && connectionInfo?.effectiveType !== 'slow-2g' && connectionInfo?.effectiveType !== '2g';
  };

  return {
    connectionInfo,
    settings,
    getOptimizedImageUrl,
    getVideoPreloadStrategy,
    shouldLoadPreview,
    updateSettings: setSettings
  };
};