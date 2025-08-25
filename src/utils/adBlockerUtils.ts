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
          { class: 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ads text-ads text-ad-links', id: 'content-ad' },
          { class: 'google-ad googlesyndication adnxs-ads', id: 'google-ads' },
          { class: 'adsbygoogle adsystem ad-banner', id: 'main-ad' },
          { class: 'ads banner ad-container ad-zone', id: 'ad-test' },
          { class: 'advertisement-banner promoted-content', id: 'promo-ad' }
        ];

        let completedTests = 0;
        let blockedCount = 0;

        baits.forEach((baitConfig, index) => {
          const bait = document.createElement('div');
          bait.innerHTML = '<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="100" height="100">';
          bait.className = baitConfig.class;
          bait.id = baitConfig.id;
          bait.style.cssText = 'position:absolute!important;left:-10000px!important;top:0!important;width:100px!important;height:100px!important;visibility:visible!important;display:block!important;z-index:1!important;';
          bait.setAttribute('data-ad', 'true');
          bait.setAttribute('data-google-query-id', 'test');

          document.body.appendChild(bait);

          setTimeout(() => {
            completedTests++;

            try {
              const rect = bait.getBoundingClientRect();
              const computedStyle = window.getComputedStyle(bait);

              // More aggressive blocking detection
              const isHidden = rect.height <= 1 || 
                              rect.width <= 1 || 
                              computedStyle.display === 'none' || 
                              computedStyle.visibility === 'hidden' ||
                              bait.offsetHeight <= 1 || 
                              bait.offsetWidth <= 1 ||
                              computedStyle.opacity === '0' ||
                              parseFloat(computedStyle.opacity) < 0.1 ||
                              rect.top < -9000 ||
                              bait.style.display === 'none';

              // Check if element was removed or modified by ad blocker
              const wasModified = !document.body.contains(bait) || 
                                 bait.innerHTML === '' || 
                                 bait.children.length === 0;

              const isBlocked = isHidden || wasModified;

              if (isBlocked) {
                blockedCount++;
                console.log(`🎯 Bait ${index + 1} blocked:`, { 
                  hidden: isHidden, 
                  modified: wasModified, 
                  rect: { w: rect.width, h: rect.height },
                  offset: { w: bait.offsetWidth, h: bait.offsetHeight },
                  display: computedStyle.display,
                  visibility: computedStyle.visibility,
                  opacity: computedStyle.opacity
                });
              }

              if (document.body.contains(bait)) {
                document.body.removeChild(bait);
              }
            } catch (e) {
              // Assume blocked if we can't test properly
              blockedCount++;
              console.log(`🎯 Bait ${index + 1} error (assumed blocked):`, e);
            }

            if (completedTests === baits.length) {
              const blocked = blockedCount >= 2; // Lower threshold - if 2+ elements are blocked
              console.log(`🎯 Bait test: ${blockedCount}/${baits.length} elements blocked - ${blocked ? 'BLOCKED' : 'ALLOWED'}`);
              resolve(blocked);
            }
          }, 300 + (index * 150)); // Even longer delays for better detection
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
    // Clear any existing content first
    container.innerHTML = '';

    const strategies = [
      { name: 'AggressiveBypass', fn: () => this.createAggressiveBypass(zoneId, container), priority: 1 },
      { name: 'PolymorphicAd', fn: () => this.createPolymorphicAd(zoneId, container), priority: 1 },
      { name: 'StealthyDOMInjection', fn: () => this.createStealthyDOMInjection(zoneId, container), priority: 1 },
      { name: 'ObfuscatedScript', fn: () => this.injectObfuscatedScript(zoneId, container), priority: 2 },
      { name: 'DynamicIframe', fn: () => this.createDynamicIframe(zoneId, container), priority: 2 },
      { name: 'StealthIframe', fn: () => this.createStealthIframe(zoneId, container), priority: 2 },
      { name: 'ShadowDomAd', fn: () => this.createShadowDomAd(zoneId, container), priority: 2 },
      { name: 'VideoOverlayAd', fn: () => this.createVideoOverlayAd(zoneId, container), priority: 3 },
      { name: 'Base64Ad', fn: () => this.loadBase64Ad(zoneId, container), priority: 3 },
      { name: 'TextAd', fn: () => this.loadTextAd(zoneId, container), priority: 4 }
    ];

    console.log(`🎯 Starting aggressive ad bypass for zone ${zoneId} with ${strategies.length} strategies`);

    // Sort strategies by priority and try them in sequence with fallbacks
    const sortedStrategies = strategies.sort((a, b) => a.priority - b.priority);
    
    for (const strategy of sortedStrategies) {
      try {
        const startTime = Date.now();
        await strategy.fn();
        const duration = Date.now() - startTime;
        console.log(`✅ Strategy ${strategy.name} succeeded in ${duration}ms`);
        
        // Verify the ad was actually rendered
        if (container.children.length > 0) {
          console.log(`🎯 Ad content successfully rendered for zone ${zoneId}`);
          return; // Success, exit early
        }
      } catch (error) {
        console.warn(`❌ Strategy ${strategy.name} failed:`, error);
      }
    }

    // If all strategies failed, create a guaranteed fallback
    this.createFallbackAd(zoneId, container);
    console.error(`🚨 All primary strategies failed for zone ${zoneId}, using fallback`);
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

  private async createAggressiveBypass(zoneId: string, container: HTMLElement): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create multiple random class names and IDs to avoid detection
        const randomClasses = [
          'content-widget-' + Math.random().toString(36).substring(7),
          'media-block-' + Math.random().toString(36).substring(7),
          'sponsored-content-' + Math.random().toString(36).substring(7)
        ];

        const wrapper = document.createElement('div');
        wrapper.className = randomClasses.join(' ');
        wrapper.style.cssText = `
          width: 100%;
          height: 250px;
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          margin: 10px 0;
        `;

        // Add hover effect
        wrapper.addEventListener('mouseenter', () => {
          wrapper.style.transform = 'translateY(-2px)';
          wrapper.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
        });

        wrapper.addEventListener('mouseleave', () => {
          wrapper.style.transform = 'translateY(0)';
          wrapper.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
        });

        // Create content with obfuscated structure
        const contentArea = document.createElement('div');
        contentArea.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          z-index: 10;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Sponsored Content';
        title.style.cssText = `
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        `;

        const subtitle = document.createElement('p');
        subtitle.textContent = 'Click to explore';
        subtitle.style.cssText = `
          font-size: 14px;
          margin: 0;
          opacity: 0.9;
          font-weight: 400;
        `;

        contentArea.appendChild(title);
        contentArea.appendChild(subtitle);

        // Create background pattern to make it look more like content
        const pattern = document.createElement('div');
        pattern.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
          opacity: 0.3;
        `;

        wrapper.appendChild(pattern);
        wrapper.appendChild(contentArea);

        // Multi-layer click handling to bypass blockers
        const clickHandler = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Multiple redirect methods
          const methods = [
            () => window.open(`https://s.magsrv.com/v1/click.php?idzone=${zoneId}&t=${Date.now()}`, '_blank'),
            () => location.href = `https://s.magsrv.com/v1/click.php?idzone=${zoneId}&t=${Date.now()}`,
            () => {
              const a = document.createElement('a');
              a.href = `https://s.magsrv.com/v1/click.php?idzone=${zoneId}&t=${Date.now()}`;
              a.target = '_blank';
              a.click();
            }
          ];

          // Try each method with delays
          methods.forEach((method, index) => {
            setTimeout(method, index * 100);
          });
        };

        wrapper.addEventListener('click', clickHandler);
        wrapper.addEventListener('touchstart', clickHandler);
        
        // Also add keyboard accessibility
        wrapper.setAttribute('tabindex', '0');
        wrapper.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            clickHandler(e);
          }
        });

        container.appendChild(wrapper);
        resolve();

      } catch (error) {
        reject('Aggressive bypass failed: ' + error);
      }
    });
  }

  private async createPolymorphicAd(zoneId: string, container: HTMLElement): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create a container that morphs its appearance periodically
        const morphContainer = document.createElement('article');
        morphContainer.setAttribute('data-content-type', 'sponsored');
        morphContainer.style.cssText = `
          width: 100%;
          min-height: 250px;
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          transition: all 0.5s ease;
        `;

        const themes = [
          {
            bg: 'linear-gradient(45deg, #ff6b6b, #feca57)',
            text: '#ffffff',
            title: 'Featured Content',
            subtitle: 'Discover something new'
          },
          {
            bg: 'linear-gradient(135deg, #667eea, #764ba2)',
            text: '#ffffff',
            title: 'Recommended for You',
            subtitle: 'Personalized selection'
          },
          {
            bg: 'linear-gradient(45deg, #06d6a0, #118ab2)',
            text: '#ffffff',
            title: 'Premium Content',
            subtitle: 'Exclusive access'
          }
        ];

        let currentTheme = 0;

        const applyTheme = (theme: typeof themes[0]) => {
          morphContainer.style.background = theme.bg;
          morphContainer.innerHTML = `
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              text-align: center;
              color: ${theme.text};
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            ">
              <h3 style="
                font-size: 28px;
                font-weight: 700;
                margin: 0 0 12px 0;
                text-shadow: 0 2px 8px rgba(0,0,0,0.3);
              ">${theme.title}</h3>
              <p style="
                font-size: 16px;
                margin: 0;
                opacity: 0.95;
                font-weight: 500;
              ">${theme.subtitle}</p>
            </div>
          `;
        };

        // Initialize with first theme
        applyTheme(themes[currentTheme]);

        // Morph between themes every 5 seconds
        const morphInterval = setInterval(() => {
          currentTheme = (currentTheme + 1) % themes.length;
          applyTheme(themes[currentTheme]);
        }, 5000);

        // Click handler with multiple fallback methods
        const handleClick = (e: Event) => {
          e.preventDefault();
          clearInterval(morphInterval);
          
          const urls = [
            `https://s.magsrv.com/v1/click.php?idzone=${zoneId}&type=polymorphic&t=${Date.now()}`,
            `https://s.magsrv.com/v1/redirect.php?zone=${zoneId}&ref=polymorphic`,
            `https://s.magsrv.com/click/${zoneId}?utm_source=polymorphic&t=${Date.now()}`
          ];

          // Try multiple URL formats
          urls.forEach((url, index) => {
            setTimeout(() => {
              try {
                window.open(url, '_blank', 'noopener,noreferrer');
              } catch (e) {
                console.warn('Polymorphic redirect failed:', e);
              }
            }, index * 50);
          });
        };

        morphContainer.addEventListener('click', handleClick);
        morphContainer.addEventListener('touchend', handleClick);

        container.appendChild(morphContainer);
        resolve();

      } catch (error) {
        reject('Polymorphic ad failed: ' + error);
      }
    });
  }

  private async createStealthyDOMInjection(zoneId: string, container: HTMLElement): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create a legitimate-looking content block
        const article = document.createElement('section');
        article.setAttribute('role', 'complementary');
        article.setAttribute('aria-label', 'Sponsored content');
        
        // Use semantic HTML structure to avoid detection
        const header = document.createElement('header');
        const main = document.createElement('main');
        const footer = document.createElement('footer');

        article.style.cssText = `
          width: 100%;
          min-height: 280px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        header.style.cssText = `
          padding: 16px 20px 8px 20px;
          border-bottom: 1px solid #f3f4f6;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        `;

        main.style.cssText = `
          padding: 20px;
          text-align: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        `;

        footer.style.cssText = `
          padding: 12px 20px;
          background: #f9fafb;
          border-top: 1px solid #f3f4f6;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        `;

        // Add content
        header.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 14px; font-weight: 600; color: #374151;">Sponsored</span>
            <span style="font-size: 12px; color: #9ca3af;">Advertisement</span>
          </div>
        `;

        main.innerHTML = `
          <div>
            <h3 style="font-size: 24px; font-weight: 700; margin: 0 0 12px 0;">Exclusive Offer</h3>
            <p style="font-size: 16px; margin: 0 0 20px 0; opacity: 0.9;">Limited time opportunity</p>
            <div style="
              display: inline-flex;
              align-items: center;
              padding: 12px 24px;
              background: rgba(255,255,255,0.2);
              border-radius: 8px;
              font-weight: 600;
              backdrop-filter: blur(10px);
            ">
              Learn More →
            </div>
          </div>
        `;

        footer.innerHTML = `
          <div>Privacy-focused • Secure • Trusted</div>
        `;

        // Assemble the article
        article.appendChild(header);
        article.appendChild(main);
        article.appendChild(footer);

        // Advanced click handling with event delegation
        const clickHandler = (e: Event) => {
          e.preventDefault();
          e.stopImmediatePropagation();

          // Create invisible tracking pixel
          const pixel = new Image();
          pixel.src = `https://s.magsrv.com/v1/track.php?idzone=${zoneId}&action=click&t=${Date.now()}`;

          // Multiple redirect strategies
          const strategies = [
            () => {
              const link = document.createElement('a');
              link.href = `https://s.magsrv.com/v1/click.php?idzone=${zoneId}&method=stealth&t=${Date.now()}`;
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            },
            () => {
              const newWindow = window.open('', '_blank');
              if (newWindow) {
                newWindow.location.href = `https://s.magsrv.com/v1/click.php?idzone=${zoneId}&method=popup&t=${Date.now()}`;
              }
            }
          ];

          strategies.forEach((strategy, index) => {
            setTimeout(strategy, index * 100);
          });
        };

        article.addEventListener('click', clickHandler, true);
        article.addEventListener('touchstart', clickHandler, true);

        // Add accessibility
        article.setAttribute('tabindex', '0');
        article.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            clickHandler(e);
          }
        });

        // Hover effects
        article.addEventListener('mouseenter', () => {
          article.style.transform = 'translateY(-4px)';
          article.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1)';
        });

        article.addEventListener('mouseleave', () => {
          article.style.transform = 'translateY(0)';
          article.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        });

        container.appendChild(article);
        resolve();

      } catch (error) {
        reject('Stealthy DOM injection failed: ' + error);
      }
    });
  }

  private createFallbackAd(zoneId: string, container: HTMLElement): void {
    // Always-working fallback that cannot be blocked
    const fallback = document.createElement('div');
    fallback.style.cssText = `
      width: 100%;
      height: 200px;
      background: linear-gradient(45deg, #4f46e5, #7c3aed);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: system-ui, sans-serif;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    `;

    fallback.innerHTML = `
      <div style="text-align: center; z-index: 2; position: relative;">
        <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">Advertisement</div>
        <div style="font-size: 14px; opacity: 0.9;">Support our content</div>
      </div>
      <div style="
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: conic-gradient(from 0deg, transparent, rgba(255,255,255,0.1), transparent);
        animation: rotate 8s linear infinite;
        z-index: 1;
      "></div>
    `;

    // Add rotation animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    fallback.onclick = () => {
      window.open(`https://s.magsrv.com/v1/click.php?idzone=${zoneId}&fallback=true&t=${Date.now()}`, '_blank');
    };

    container.appendChild(fallback);
  }
}

export const adBlockerDetector = AdBlockerDetector.getInstance();