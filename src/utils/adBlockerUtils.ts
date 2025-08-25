
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
      return this.detectionResults.get(cacheKey)!;
    }

    let isBlocked = false;

    try {
      // Test 1: Multiple bait elements with different detection methods
      const baits = [
        { class: 'adsbox banner-ads google-ads', id: 'ads-top-banner' },
        { class: 'ad advertisement', id: 'sidebar-ad' },
        { class: 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links', id: 'content-ad' },
        { class: 'google-ad', id: 'google-ads' }
      ];

      for (const baitConfig of baits) {
        const bait = document.createElement('div');
        bait.innerHTML = '&nbsp;';
        bait.className = baitConfig.class;
        bait.id = baitConfig.id;
        bait.style.cssText = 'position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;visibility:hidden!important;';
        
        document.body.appendChild(bait);
        
        // Check if element is blocked
        setTimeout(() => {
          if (document.body.contains(bait)) {
            const rect = bait.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(bait);
            
            if (rect.height === 0 || rect.width === 0 || 
                computedStyle.display === 'none' || 
                computedStyle.visibility === 'hidden' ||
                bait.offsetHeight === 0 || 
                bait.offsetWidth === 0) {
              isBlocked = true;
            }
            
            document.body.removeChild(bait);
          }
        }, 100);
      }

      // Test 2: Check for ad blocker extensions
      const adBlockerKeywords = ['adblock', 'ublock', 'ghostery', 'adguard', 'adnauseam'];
      const extensions = Array.from(document.querySelectorAll('*')).some(el => {
        const className = el.className?.toString().toLowerCase() || '';
        return adBlockerKeywords.some(keyword => className.includes(keyword));
      });

      if (extensions) isBlocked = true;

      // Test 3: Try fetching known ad-serving resources
      try {
        const testUrls = [
          'https://googleads.g.doubleclick.net/favicon.ico',
          'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
        ];

        const fetchPromises = testUrls.map(url => 
          fetch(url, { 
            method: 'HEAD', 
            mode: 'no-cors',
            cache: 'no-cache'
          }).catch(() => Promise.reject('blocked'))
        );

        await Promise.any(fetchPromises);
      } catch {
        isBlocked = true;
      }

      // Test 4: Check for blocked network requests
      const originalFetch = window.fetch;
      let fetchBlocked = false;
      
      window.fetch = function(...args) {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('ads')) {
          fetchBlocked = true;
        }
        return originalFetch.apply(this, args);
      };

      if (fetchBlocked) isBlocked = true;

      this.detectionResults.set(cacheKey, isBlocked);
      return isBlocked;

    } catch (error) {
      this.detectionResults.set(cacheKey, true);
      return true;
    }
  }

  async bypassAdBlocker(zoneId: string, container: HTMLElement): Promise<void> {
    const strategies = [
      () => this.injectObfuscatedScript(zoneId, container),
      () => this.createDynamicIframe(zoneId, container),
      () => this.createStealthIframe(zoneId, container),
      () => this.loadImageAd(zoneId, container),
      () => this.loadBase64Ad(zoneId, container),
      () => this.createShadowDomAd(zoneId, container),
      () => this.loadTextAd(zoneId, container)
    ];

    // Try multiple strategies simultaneously for better success rate
    const promises = strategies.map(strategy => 
      strategy().catch(error => {
        console.warn('Ad loading strategy failed:', error);
        return null;
      })
    );

    await Promise.allSettled(promises);
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
    iframe.sandbox = 'allow-scripts allow-same-origin';
    
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
}

export const adBlockerDetector = AdBlockerDetector.getInstance();
