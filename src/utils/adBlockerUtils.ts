
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

    try {
      // Test 1: Fetch known ad-serving domains
      const adDomains = [
        'https://googleads.g.doubleclick.net/favicon.ico',
        'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
        'https://www.googletagservices.com/tag/js/gpt.js'
      ];

      const fetchPromises = adDomains.map(domain => 
        fetch(domain, { 
          method: 'HEAD', 
          mode: 'no-cors',
          cache: 'no-cache'
        }).catch(() => Promise.reject())
      );

      await Promise.any(fetchPromises);

      // Test 2: Create bait element
      const bait = document.createElement('div');
      bait.innerHTML = '&nbsp;';
      bait.className = 'adsbox banner-ads google-ads';
      bait.style.position = 'absolute';
      bait.style.left = '-10000px';
      bait.style.width = '1px';
      bait.style.height = '1px';
      
      document.body.appendChild(bait);
      
      setTimeout(() => {
        const isBlocked = bait.offsetHeight === 0 || 
                         bait.offsetWidth === 0 || 
                         window.getComputedStyle(bait).display === 'none';
        
        document.body.removeChild(bait);
        this.detectionResults.set(cacheKey, isBlocked);
      }, 100);

      this.detectionResults.set(cacheKey, false);
      return false;

    } catch (error) {
      this.detectionResults.set(cacheKey, true);
      return true;
    }
  }

  async bypassAdBlocker(zoneId: string, container: HTMLElement): Promise<void> {
    const strategies = [
      () => this.injectAlternativeScript(zoneId, container),
      () => this.createDynamicIframe(zoneId, container),
      () => this.loadImageAd(zoneId, container),
      () => this.loadTextAd(zoneId, container)
    ];

    for (const strategy of strategies) {
      try {
        await strategy();
        break;
      } catch (error) {
        console.warn('Ad loading strategy failed:', error);
        continue;
      }
    }
  }

  private async injectAlternativeScript(zoneId: string, container: HTMLElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const randomParam = Math.random().toString(36).substring(7);
      
      script.src = `https://s.magsrv.com/v1/ads.php?idzone=${zoneId}&r=${randomParam}`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject();
      
      container.appendChild(script);
    });
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
