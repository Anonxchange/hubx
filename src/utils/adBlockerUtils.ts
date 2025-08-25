
declare global {
  interface Window {
    __adBlockTest?: boolean;
  }
}

export class AdBlockerDetector {
  private static instance: AdBlockerDetector;
  private detectionResults: Map<string, boolean> = new Map();

  static getInstance(): AdBlockerDetector {
    if (!AdBlockerDetector.instance) {
      AdBlockerDetector.instance = new AdBlockerDetector();
    }
    return AdBlockerDetector.instance;
  }

  async detectAdBlocker(): Promise<boolean> {
    const cacheKey = 'adblock_detection';
    
    if (this.detectionResults.has(cacheKey)) {
      console.log('🔍 Using cached ad blocker detection result');
      return this.detectionResults.get(cacheKey)!;
    }

    console.log('🔍 Starting comprehensive ad blocker detection...');
    let isBlocked = false;
    const detectionMethods = [];

    try {
      // Test 1: Enhanced bait elements with better detection
      const baitPromise = new Promise<boolean>((resolve) => {
        const baits = [
          { class: 'adsbox banner-ads google-ads doubleclick-ads', id: 'ads-top-banner' },
          { class: 'ad advertisement sponsor sponsored-content', id: 'sidebar-ad' },
          { class: 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links', id: 'content-ad' },
          { class: 'google-ad googlesyndication adnxs-ads', id: 'google-ads' },
          { class: 'adsbygoogle adsystem ad-banner', id: 'main-ad' }
        ];

        let blockedCount = 0;
        baits.forEach((baitConfig, index) => {
          const bait = document.createElement('div');
          bait.innerHTML = '&nbsp;';
          bait.className = baitConfig.class;
          bait.id = baitConfig.id;
          bait.style.cssText = 'position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;visibility:hidden!important;';
          
          document.body.appendChild(bait);
          
          setTimeout(() => {
            if (document.body.contains(bait)) {
              const rect = bait.getBoundingClientRect();
              const computedStyle = window.getComputedStyle(bait);
              
              if (rect.height === 0 || rect.width === 0 || 
                  computedStyle.display === 'none' || 
                  computedStyle.visibility === 'hidden' ||
                  bait.offsetHeight === 0 || 
                  bait.offsetWidth === 0) {
                blockedCount++;
              }
              
              try {
                document.body.removeChild(bait);
              } catch (e) {
                // Element might already be removed
              }
            }
            
            if (index === baits.length - 1) {
              const blocked = blockedCount > baits.length / 2;
              console.log(`🎯 Bait test: ${blockedCount}/${baits.length} elements blocked - ${blocked ? 'BLOCKED' : 'ALLOWED'}`);
              resolve(blocked);
            }
          }, 150 + (index * 50));
        });
      });

      detectionMethods.push(baitPromise);

      // Test 2: Check for ad blocker extensions and browser-specific blocking
      const extensionPromise = new Promise<boolean>((resolve) => {
        const adBlockerKeywords = ['adblock', 'ublock', 'ghostery', 'adguard', 'adnauseam', 'brave-shields'];
        const extensions = Array.from(document.querySelectorAll('*')).some(el => {
          const className = el.className?.toString().toLowerCase() || '';
          const id = el.id?.toString().toLowerCase() || '';
          return adBlockerKeywords.some(keyword => className.includes(keyword) || id.includes(keyword));
        });

        // Check for Opera Mini specific blocking
        const isOperaMini = navigator.userAgent.includes('Opera Mini') || 
                           navigator.userAgent.includes('OPIM') ||
                           window.operaMini !== undefined;
        
        const operaBlocking = isOperaMini && (
          !window.navigator.onLine || 
          document.querySelector('meta[name="viewport"][content*="opera"]') !== null
        );

        const detected = extensions || operaBlocking;
        console.log(`🔌 Extension detection: ${detected ? 'DETECTED' : 'NOT DETECTED'}${isOperaMini ? ' (Opera Mini detected)' : ''}`);
        resolve(detected);
      });

      detectionMethods.push(extensionPromise);

      // Test 3: Network request blocking test
      const networkPromise = new Promise<boolean>((resolve) => {
        const testUrls = [
          'https://googleads.g.doubleclick.net/favicon.ico',
          'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
          'https://www.google-analytics.com/analytics.js'
        ];

        const fetchPromises = testUrls.map(url => 
          fetch(url, { 
            method: 'HEAD', 
            mode: 'no-cors',
            cache: 'no-cache'
          }).then(() => false).catch(() => true)
        );

        Promise.all(fetchPromises).then(results => {
          const blockedCount = results.filter(blocked => blocked).length;
          const networkBlocked = blockedCount >= testUrls.length / 2;
          console.log(`🌐 Network test: ${blockedCount}/${testUrls.length} requests blocked - ${networkBlocked ? 'BLOCKED' : 'ALLOWED'}`);
          resolve(networkBlocked);
        });
      });

      detectionMethods.push(networkPromise);

      // Test 4: Script injection blocking test
      const scriptPromise = new Promise<boolean>((resolve) => {
        const script = document.createElement('script');
        script.src = 'data:text/javascript;base64,' + btoa('window.__adBlockTest = true;');
        script.onload = () => {
          const blocked = !(window as any).__adBlockTest;
          console.log(`📜 Script injection test: ${blocked ? 'BLOCKED' : 'ALLOWED'}`);
          resolve(blocked);
        };
        script.onerror = () => {
          console.log(`📜 Script injection test: BLOCKED`);
          resolve(true);
        };
        document.head.appendChild(script);
        
        setTimeout(() => {
          const blocked = !(window as any).__adBlockTest;
          console.log(`📜 Script injection test (timeout): ${blocked ? 'BLOCKED' : 'ALLOWED'}`);
          resolve(blocked);
        }, 200);
      });

      detectionMethods.push(scriptPromise);

      // Wait for all detection methods
      const results = await Promise.all(detectionMethods);
      const blockedCount = results.filter(blocked => blocked).length;
      isBlocked = blockedCount >= Math.ceil(detectionMethods.length / 2);

      console.log(`📊 Detection Summary: ${blockedCount}/${detectionMethods.length} methods detected blocking - Final result: ${isBlocked ? 'AD BLOCKER DETECTED' : 'NO AD BLOCKER'}`);

      this.detectionResults.set(cacheKey, isBlocked);
      return isBlocked;

    } catch (error) {
      this.detectionResults.set(cacheKey, true);
      return true;
    }
  }

  async bypassAdBlocker(zoneId: string, container: HTMLElement): Promise<void> {
    const strategies = [
      { name: 'ObfuscatedScript', fn: () => this.injectObfuscatedScript(zoneId, container) },
      { name: 'DynamicIframe', fn: () => this.createDynamicIframe(zoneId, container) },
      { name: 'StealthIframe', fn: () => this.createStealthIframe(zoneId, container) },
      { name: 'ImageAd', fn: () => this.loadImageAd(zoneId, container) },
      { name: 'Base64Ad', fn: () => this.loadBase64Ad(zoneId, container) },
      { name: 'ShadowDomAd', fn: () => this.createShadowDomAd(zoneId, container) },
      { name: 'TextAd', fn: () => this.loadTextAd(zoneId, container) },
      { name: 'WebWorkerAd', fn: () => this.loadWebWorkerAd(zoneId, container) },
      { name: 'ServiceWorkerAd', fn: () => this.loadServiceWorkerAd(zoneId, container) },
      { name: 'VideoOverlayAd', fn: () => this.createVideoOverlayAd(zoneId, container) },
      { name: 'OperaMiniBypass', fn: () => this.createOperaMiniBypass(zoneId, container) }
    ];

    console.log(`🎯 Starting ad bypass for zone ${zoneId} with ${strategies.length} strategies`);
    
    // Try multiple strategies simultaneously for better success rate
    const promises = strategies.map(async (strategy, index) => {
      try {
        const startTime = Date.now();
        await strategy.fn();
        const duration = Date.now() - startTime;
        console.log(`✅ Strategy ${index + 1} (${strategy.name}) succeeded in ${duration}ms`);
        return { success: true, strategy: strategy.name, duration };
      } catch (error) {
        console.warn(`❌ Strategy ${index + 1} (${strategy.name}) failed:`, error);
        return { success: false, strategy: strategy.name, error: error instanceof Error ? error.message : String(error) };
      }
    });

    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`📊 Bypass Results for zone ${zoneId}:`, {
      total: strategies.length,
      successful: successful.length,
      failed: failed.length,
      successfulStrategies: successful.map(r => r.strategy),
      failedStrategies: failed.map(r => ({ name: r.strategy, error: r.error }))
    });

    if (successful.length === 0) {
      console.error(`🚨 All bypass strategies failed for zone ${zoneId}`);
    }
  }

  private async injectObfuscatedScript(zoneId: string, container: HTMLElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const randomParam = Math.random().toString(36).substring(7);
      const timestamp = Date.now();
      
      // Obfuscate the script injection
      const scriptContent = `
        (function() {
          var s = document.createElement('script');
          s.src = 'https://s.magsrv.com/v1/ads.php?idzone=${zoneId}&r=${randomParam}&t=${timestamp}';
          s.async = true;
          s.onload = function() { console.log('Ad loaded for zone ${zoneId}'); };
          document.head.appendChild(s);
        })();
      `;
      
      script.textContent = scriptContent;
      script.onload = () => resolve();
      script.onerror = () => reject();
      
      // Use different injection methods
      setTimeout(() => {
        try {
          container.appendChild(script);
        } catch {
          document.head.appendChild(script);
        }
      }, Math.random() * 1000);
    });
  }

  private async createStealthIframe(zoneId: string, container: HTMLElement): Promise<void> {
    const iframe = document.createElement('iframe');
    const randomId = Math.random().toString(36).substring(7);
    
    iframe.id = `content-${randomId}`;
    iframe.src = `data:text/html;base64,${btoa(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { margin: 0; padding: 0; }
            .content-area { width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          <div class="content-area" id="zone-${zoneId}">
            <script src="https://s.magsrv.com/v1/ads.php?idzone=${zoneId}&type=iframe&t=${Date.now()}"></script>
          </div>
        </body>
      </html>
    `)}`;
    
    iframe.style.cssText = 'width:100%;height:250px;border:none;display:block;';
    iframe.loading = 'lazy';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    
    container.appendChild(iframe);
  }

  private async loadBase64Ad(zoneId: string, container: HTMLElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      
      // Create a canvas to generate a base64 ad placeholder
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 250;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 300, 250);
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Advertisement', 150, 125);
        
        img.src = canvas.toDataURL();
        img.style.cssText = 'max-width:100%;height:auto;display:block;cursor:pointer;';
        img.onclick = () => {
          window.open(`https://s.magsrv.com/v1/click.php?idzone=${zoneId}`, '_blank');
        };
        
        container.appendChild(img);
        resolve();
      } else {
        reject('Canvas not supported');
      }
    });
  }

  private async createShadowDomAd(zoneId: string, container: HTMLElement): Promise<void> {
    try {
      const host = document.createElement('div');
      host.style.cssText = 'width:100%;height:250px;display:block;';
      
      if (host.attachShadow) {
        const shadow = host.attachShadow({ mode: 'closed' });
        const adContent = document.createElement('div');
        adContent.innerHTML = `
          <style>
            .shadow-ad {
              width: 100%;
              height: 250px;
              background: linear-gradient(45deg, #f0f0f0, #e0e0e0);
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
              cursor: pointer;
              border: 1px solid #ddd;
            }
          </style>
          <div class="shadow-ad" onclick="window.open('https://s.magsrv.com/v1/click.php?idzone=${zoneId}', '_blank')">
            <span>Advertisement</span>
          </div>
        `;
        
        shadow.appendChild(adContent);
        container.appendChild(host);
        
        // Also try to inject script into shadow DOM
        const script = document.createElement('script');
        script.src = `https://s.magsrv.com/v1/ads.php?idzone=${zoneId}&shadow=1`;
        shadow.appendChild(script);
      }
    } catch (error) {
      throw new Error('Shadow DOM not supported');
    }
  }

  private async createDynamicIframe(zoneId: string, container: HTMLElement): Promise<void> {
    const iframe = document.createElement('iframe');
    iframe.src = `https://s.magsrv.com/v1/iframe.php?idzone=${zoneId}`;
    iframe.style.cssText = 'width:100%;height:250px;border:none;display:block;';
    iframe.loading = 'lazy';
    
    container.appendChild(iframe);
  }

  private async loadImageAd(zoneId: string, container: HTMLElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.src = `https://s.magsrv.com/v1/banner.php?idzone=${zoneId}&type=image`;
      img.style.cssText = 'max-width:100%;height:auto;display:block;';
      img.onload = () => resolve();
      img.onerror = () => reject();
      
      container.appendChild(img);
    });
  }

  private async loadTextAd(zoneId: string, container: HTMLElement): Promise<void> {
    const textAd = document.createElement('div');
    textAd.innerHTML = `
      <div style="padding:20px;background:#f0f0f0;border:1px solid #ddd;text-align:center;">
        <p style="margin:0;color:#666;">Advertisement</p>
        <a href="https://s.magsrv.com/v1/click.php?idzone=${zoneId}" 
           target="_blank" 
           style="color:#007bff;text-decoration:none;">
          Support our content - Click here
        </a>
      </div>
    `;
    
    container.appendChild(textAd);
  }

  private async loadWebWorkerAd(zoneId: string, container: HTMLElement): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create a web worker with ad loading script
        const workerScript = `
          self.onmessage = function(e) {
            const { zoneId } = e.data;
            
            // Simulate ad loading in worker
            const adData = {
              type: 'ad',
              content: '<div style="width:300px;height:250px;background:linear-gradient(45deg, #6366f1, #8b5cf6);display:flex;align-items:center;justify-content:center;color:white;font-family:Arial,sans-serif;cursor:pointer;" onclick="window.open(\\'https://s.magsrv.com/v1/click.php?idzone=' + zoneId + '\\', \\'_blank\\')">Advertisement</div>',
              zoneId: zoneId
            };
            
            self.postMessage(adData);
          };
        `;
        
        const blob = new Blob([workerScript], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));
        
        worker.onmessage = (e) => {
          const { content } = e.data;
          const adDiv = document.createElement('div');
          adDiv.innerHTML = content;
          container.appendChild(adDiv);
          worker.terminate();
          resolve();
        };
        
        worker.onerror = () => {
          worker.terminate();
          reject('Web Worker failed');
        };
        
        worker.postMessage({ zoneId });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          worker.terminate();
          reject('Web Worker timeout');
        }, 5000);
        
      } catch (error) {
        reject('Web Worker not supported');
      }
    });
  }

  private async loadServiceWorkerAd(zoneId: string, container: HTMLElement): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('serviceWorker' in navigator)) {
        reject('Service Worker not supported');
        return;
      }

      try {
        // Create service worker script dynamically
        const swScript = `
          self.addEventListener('message', function(event) {
            if (event.data.type === 'AD_REQUEST') {
              const zoneId = event.data.zoneId;
              
              // Send ad data back
              event.ports[0].postMessage({
                type: 'AD_RESPONSE',
                content: '<div style="width:300px;height:250px;background:linear-gradient(45deg, #10b981, #059669);display:flex;align-items:center;justify-content:center;color:white;font-family:Arial,sans-serif;cursor:pointer;" onclick="window.open(\\'https://s.magsrv.com/v1/click.php?idzone=' + zoneId + '\\', \\'_blank\\')">SW Advertisement</div>',
                zoneId: zoneId
              });
            }
          });
        `;
        
        const blob = new Blob([swScript], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);
        
        navigator.serviceWorker.register(swUrl).then(registration => {
          const channel = new MessageChannel();
          
          channel.port1.onmessage = (event) => {
            if (event.data.type === 'AD_RESPONSE') {
              const adDiv = document.createElement('div');
              adDiv.innerHTML = event.data.content;
              container.appendChild(adDiv);
              
              // Clean up
              registration.unregister();
              URL.revokeObjectURL(swUrl);
              resolve();
            }
          };
          
          // Send message to service worker
          if (registration.active) {
            registration.active.postMessage(
              { type: 'AD_REQUEST', zoneId },
              [channel.port2]
            );
          } else {
            reject('Service Worker not active');
          }
          
          // Timeout after 5 seconds
          setTimeout(() => {
            registration.unregister();
            URL.revokeObjectURL(swUrl);
            reject('Service Worker timeout');
          }, 5000);
          
        }).catch(() => {
          reject('Service Worker registration failed');
        });
        
      } catch (error) {
        reject('Service Worker error');
      }
    });
  }

  private async createVideoOverlayAd(zoneId: string, container: HTMLElement): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create a video-style overlay that mimics video player controls
        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position: relative;
          width: 100%;
          height: 250px;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        // Create fake video content area
        const videoContent = document.createElement('div');
        videoContent.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 40px;
          background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: Arial, sans-serif;
          font-size: 18px;
          font-weight: bold;
        `;
        videoContent.textContent = '▶ Sponsored Content';
        
        // Create fake video controls
        const controls = document.createElement('div');
        controls.style.cssText = `
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 40px;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          padding: 0 15px;
          color: white;
          font-size: 12px;
        `;
        
        const playButton = document.createElement('div');
        playButton.style.cssText = `
          width: 20px;
          height: 20px;
          margin-right: 10px;
          cursor: pointer;
        `;
        playButton.innerHTML = '▶';
        
        const timeDisplay = document.createElement('div');
        timeDisplay.textContent = '0:30 / 0:30';
        timeDisplay.style.cssText = 'margin-left: auto;';
        
        controls.appendChild(playButton);
        controls.appendChild(timeDisplay);
        overlay.appendChild(videoContent);
        overlay.appendChild(controls);
        
        // Click handler for the entire overlay
        overlay.onclick = () => {
          window.open(`https://s.magsrv.com/v1/click.php?idzone=${zoneId}&type=video`, '_blank');
        };
        
        // Add a small delay to mimic video loading
        setTimeout(() => {
          container.appendChild(overlay);
          resolve();
        }, 100);
        
      } catch (error) {
        reject('Video overlay ad creation failed');
      }
    });
  }

  private async createOperaMiniBypass(zoneId: string, container: HTMLElement): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const isOperaMini = navigator.userAgent.includes('Opera Mini') || 
                           navigator.userAgent.includes('OPIM');
        
        if (!isOperaMini) {
          reject('Not Opera Mini browser');
          return;
        }
        
        // Opera Mini specific bypass using image sprites and CSS
        const operaAd = document.createElement('div');
        operaAd.style.cssText = `
          width: 300px;
          height: 250px;
          background-image: linear-gradient(45deg, #ff6b6b, #4ecdc4);
          position: relative;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          margin: 0 auto;
        `;
        
        // Create content using CSS only (Opera Mini processes CSS server-side)
        const content = document.createElement('div');
        content.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          text-align: center;
          font-family: Arial, sans-serif;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        `;
        content.innerHTML = `
          <div style="font-size: 16px; margin-bottom: 8px;">Advertisement</div>
          <div style="font-size: 12px; opacity: 0.9;">Tap to continue</div>
        `;
        
        // Use setTimeout to bypass Opera Mini's script blocking
        const clickHandler = function() {
          setTimeout(() => {
            const url = `https://s.magsrv.com/v1/click.php?idzone=${zoneId}&browser=operamini&t=${Date.now()}`;
            window.open(url, '_blank');
          }, 50);
        };
        
        operaAd.appendChild(content);
        operaAd.addEventListener('click', clickHandler);
        operaAd.addEventListener('touchstart', clickHandler);
        
        // Add specific meta tag for Opera Mini
        const meta = document.createElement('meta');
        meta.name = 'opera-ad-zone';
        meta.content = zoneId;
        document.head.appendChild(meta);
        
        container.appendChild(operaAd);
        resolve();
        
      } catch (error) {
        reject('Opera Mini bypass failed');
      }
    });
  }
}

export const adBlockerDetector = AdBlockerDetector.getInstance();
