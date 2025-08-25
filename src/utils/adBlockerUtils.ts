// adblocker.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window { __adBlockTest?: boolean; }
}

type StrategyResult = { success: boolean; name: string; duration: number; error?: string };

export type AdBypassOptions = {
  stopOnFirstSuccess?: boolean;    // default: true
  maxParallel?: number;            // default: 2
  detectCacheKey?: string;         // default: 'adblock_detection'
  detectionTTLms?: number;         // default: 5 * 60_000
  timeoutMs?: number;              // per test/strategy timeout, default: 3_000
  logger?: Pick<Console, 'log' | 'warn' | 'error'> | null; // default: console
};

export class AdBlockerDetector {
  private static instance: AdBlockerDetector;
  private memCache = new Map<string, { value: boolean; at: number }>();
  private log: NonNullable<AdBypassOptions['logger']>;

  static getInstance(opts: AdBypassOptions = {}): AdBlockerDetector {
    if (!AdBlockerDetector.instance) {
      AdBlockerDetector.instance = new AdBlockerDetector(opts);
    } else if (opts.logger !== undefined) {
      AdBlockerDetector.instance.log = opts.logger ?? console;
    }
    return AdBlockerDetector.instance;
  }

  private constructor(private opts: AdBypassOptions) {
    this.log = opts.logger ?? console;
  }

  // ---------- DETECTION ----------
  async detectAdBlocker(): Promise<boolean> {
    const {
      detectCacheKey = 'adblock_detection',
      detectionTTLms = 5 * 60_000,
      timeoutMs = 3_000,
    } = this.opts;

    // in-memory cache (fast)
    const cached = this.memCache.get(detectCacheKey);
    if (cached && Date.now() - cached.at < detectionTTLms) {
      this.log.log('🔍 Using cached ad blocker detection result');
      return cached.value;
    }

    // sessionStorage cache (survives SPA reloads)
    try {
      const raw = sessionStorage.getItem(detectCacheKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { v: boolean; at: number };
        if (Date.now() - parsed.at < detectionTTLms) {
          this.memCache.set(detectCacheKey, { value: parsed.v, at: parsed.at });
          this.log.log('🔍 Using session cached ad blocker detection result');
          return parsed.v;
        }
      }
    } catch {}

    this.log.log('🔍 Starting staged ad blocker detection…');

    // Stage A (cheap, fast)
    const stageA = await this.withTimeout(this.domBaitTest(), timeoutMs).catch(() => false);
    if (stageA) return this.finishDetect(detectCacheKey, true);

    // Stage B (still light)
    const [ua, script] = await Promise.all([
      this.withTimeout(this.uaHeuristicsTest(), timeoutMs).catch(() => false),
      this.withTimeout(this.scriptDataUrlTest(), timeoutMs).catch(() => false),
    ]);
    if (ua || script) return this.finishDetect(detectCacheKey, true);

    // Stage C (network probing – slower, last resort)
    const net = await this.withTimeout(this.networkProbeTest(), timeoutMs).catch(() => false);
    return this.finishDetect(detectCacheKey, net);
  }

  private finishDetect(key: string, value: boolean): boolean {
    this.memCache.set(key, { value, at: Date.now() });
    try {
      sessionStorage.setItem(key, JSON.stringify({ v: value, at: Date.now() }));
    } catch {}
    this.log.log(`📊 Final detection: ${value ? 'AD BLOCKER DETECTED' : 'NO AD BLOCKER'}`);
    return value;
  }

  // --- Tests ---
  private domBaitTest(): Promise<boolean> {
    return new Promise((resolve) => {
      const markers = [
        { class: 'adsbox banner-ads google-ads doubleclick-ads', id: 'ads-top-banner' },
        { class: 'ad advertisement sponsor sponsored-content', id: 'sidebar-ad' },
        { class: 'pub_300x250 pub_728x90 text-ad textAd text_ad', id: 'content-ad' },
        { class: 'adsbygoogle adsystem ad-banner', id: 'main-ad' },
      ];
      let blocked = 0;
      let done = 0;
      const baits: HTMLDivElement[] = [];

      for (const m of markers) {
        const bait = document.createElement('div');
        bait.innerHTML = '&nbsp;';
        bait.className = m.class;
        bait.id = m.id;
        bait.style.cssText = 'position:absolute!important;left:-99999px!important;width:1px!important;height:1px!important;visibility:hidden!important;';
        document.body.appendChild(bait);
        baits.push(bait);
      }

      setTimeout(() => {
        for (const el of baits) {
          if (!document.body.contains(el)) {
            blocked++;
          } else {
            const rect = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            if (
              rect.width === 0 || rect.height === 0 ||
              cs.display === 'none' || cs.visibility === 'hidden' ||
              el.offsetWidth === 0 || el.offsetHeight === 0
            ) blocked++;
            try { el.remove(); } catch {}
          }
          done++;
          if (done === markers.length) {
            const isBlocked = blocked > markers.length / 2;
            this.log.log(`🎯 Bait test: ${blocked}/${markers.length} blocked -> ${isBlocked}`);
            resolve(isBlocked);
          }
        }
      }, 180);
    });
  }

  private uaHeuristicsTest(): Promise<boolean> {
    return new Promise((resolve) => {
      const adKeywords = ['adblock', 'ublock', 'ghostery', 'adguard', 'adnauseam', 'brave'];
      const hasSuspiciousNode = Array.from(document.querySelectorAll('*')).some(el => {
        const c = (el as HTMLElement).className?.toString().toLowerCase() || '';
        const i = (el as HTMLElement).id?.toString().toLowerCase() || '';
        return adKeywords.some(k => c.includes(k) || i.includes(k));
      });

      const ua = navigator.userAgent || '';
      const isOperaMini = /Opera Mini|OPIM/i.test(ua) || (window as any).operaMini !== undefined;

      const detected = hasSuspiciousNode || isOperaMini;
      this.log.log(`🔌 Extension/UA heuristics: ${detected} ${isOperaMini ? '(Opera Mini)' : ''}`);
      resolve(detected);
    });
  }

  private scriptDataUrlTest(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const s = document.createElement('script');
        s.src = 'data:text/javascript;base64,' + btoa('window.__adBlockTest = true;');
        const timer = setTimeout(() => {
          const blocked = !window.__adBlockTest;
          this.log.log(`📜 Script data: ${blocked ? 'BLOCKED' : 'ALLOWED'} (timeout)`);
          resolve(blocked);
        }, 200);
        s.onload = () => {
          clearTimeout(timer);
          const blocked = !window.__adBlockTest;
          this.log.log(`📜 Script data: ${blocked ? 'BLOCKED' : 'ALLOWED'}`);
          resolve(blocked);
        };
        s.onerror = () => {
          this.log.log('📜 Script data: BLOCKED (onerror)');
          resolve(true);
        };
        document.head.appendChild(s);
      } catch {
        // CSP can block data: scripts entirely
        this.log.log('📜 Script data: BLOCKED (CSP/exception)');
        resolve(true);
      }
    });
  }

  private networkProbeTest(): Promise<boolean> {
    const testUrls = [
      // keep small, ad-related hosts frequently blocked
      'https://googleads.g.doubleclick.net/favicon.ico',
      'https://pagead2.googlesyndication.com/pagead/id',
      'https://www.google-analytics.com/collect' // analytics often blocked
    ];
    return new Promise((resolve) => {
      const tries = testUrls.map(u =>
        fetch(u, { method: 'HEAD', mode: 'no-cors', cache: 'no-cache' })
          .then(() => false)
          .catch(() => true)
      );
      Promise.allSettled(tries).then(res => {
        const blockedCount = res.reduce((acc, r) => acc + ((r.status === 'fulfilled' && r.value) ? 1 : 0), 0);
        const networkBlocked = blockedCount >= Math.ceil(testUrls.length / 2);
        this.log.log(`🌐 Network test: ${blockedCount}/${testUrls.length} blocked -> ${networkBlocked}`);
        resolve(networkBlocked);
      });
    });
  }

  // ---------- BYPASS ----------
  async bypassAdBlocker(zoneId: string, container: HTMLElement): Promise<StrategyResult[]> {
    const {
      stopOnFirstSuccess = true,
      maxParallel = 2,
      timeoutMs = 3_000,
    } = this.opts;

    if (!container) throw new Error('No container provided');

    // Priority order: cheapest/highest survival first
    const strategies: Array<{ name: string; fn: () => Promise<void>; supported?: boolean }> = [
      { name: 'TextAd', fn: () => this.loadTextAd(zoneId, container) },
      { name: 'ImageAd', fn: () => this.loadImageAd(zoneId, container) },
      { name: 'Base64Ad', fn: () => this.loadBase64Ad(zoneId, container) },
      { name: 'DynamicIframe', fn: () => this.createDynamicIframe(zoneId, container) },
      { name: 'StealthIframe', fn: () => this.createStealthIframe(zoneId, container) },
      { name: 'ShadowDomAd', fn: () => this.createShadowDomAd(zoneId, container), supported: !!HTMLElement.prototype.attachShadow },
      { name: 'ObfuscatedScript', fn: () => this.injectObfuscatedScript(zoneId, container) },
      { name: 'VideoOverlayAd', fn: () => this.createVideoOverlayAd(zoneId, container) },
      { name: 'WebWorkerAd', fn: () => this.loadWebWorkerAd(zoneId, container), supported: 'Worker' in window },
      { name: 'ServiceWorkerAd', fn: () => this.loadServiceWorkerAd(zoneId, container), supported: 'serviceWorker' in navigator },
      { name: 'OperaMiniBypass', fn: () => this.createOperaMiniBypass(zoneId, container) },
    ].filter(s => s.supported !== false);

    this.log.log(`🎯 Starting bypass for zone ${zoneId} with ${strategies.length} strategies (maxParallel=${maxParallel})`);

    const results: StrategyResult[] = [];
    let success = false;

    // limited-concurrency runner with early stop
    let idx = 0;
    const runOne = async (): Promise<void> => {
      if (success && stopOnFirstSuccess) return;
      const myIdx = idx++;
      if (myIdx >= strategies.length) return;

      const strat = strategies[myIdx];
      const started = performance.now();
      try {
        await this.withTimeout(strat.fn(), timeoutMs);
        const duration = Math.round(performance.now() - started);
        results.push({ success: true, name: strat.name, duration });
        this.log.log(`✅ ${strat.name} succeeded in ${duration}ms`);
        if (stopOnFirstSuccess) success = true;
      } catch (e: any) {
        const duration = Math.round(performance.now() - started);
        results.push({ success: false, name: strat.name, duration, error: e?.message ?? String(e) });
        this.log.warn(`❌ ${strat.name} failed: ${e?.message ?? e}`);
        // try next
        if (!success || !stopOnFirstSuccess) await runOne();
      }
    };

    // kick off up to maxParallel
    const lanes = Array.from({ length: Math.min(maxParallel, strategies.length) }, () => runOne());
    await Promise.all(lanes);

    if (!results.some(r => r.success)) {
      this.log.error(`🚨 All bypass strategies failed for zone ${zoneId}`);
    }

    return results;
  }

  // ---------- Helpers ----------
  private withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    let t: any;
    return new Promise<T>((resolve, reject) => {
      t = setTimeout(() => reject(new Error('timeout')), ms);
      p.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
    });
  }

  // ---------- Strategies (mostly your originals, trimmed & guarded) ----------
  private async injectObfuscatedScript(zoneId: string, container: HTMLElement): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const script = document.createElement('script');
        const r = Math.random().toString(36).slice(2);
        const ts = Date.now();
        script.textContent = `
          (function(){
            try{
              var s=document.createElement('script');
              s.src='https://s.magsrv.com/v1/ads.php?idzone=${zoneId}&r=${r}&t=${ts}';
              s.async=true;
              s.onload=function(){ try{console.log('Ad loaded ${zoneId}');}catch(e){} };
              (document.head||document.documentElement).appendChild(s);
            }catch(e){}
          })();
        `;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('script inject error'));
        // prefer head (less selector-based blocking)
        (document.head || container || document.documentElement).appendChild(script);
        // resolve soon (actual network may be blocked but DOM path succeeded)
        setTimeout(resolve, 100);
      } catch (e) {
        reject(e);
      }
    });
  }

  private async createStealthIframe(zoneId: string, container: HTMLElement): Promise<void> {
    const html = `
      <!doctype html><html><head><meta charset="utf-8">
      <style>html,body{margin:0;height:100%} .c{width:100%;height:100%}</style>
      </head><body>
      <div class="c" id="z-${zoneId}">
        <script src="https://s.magsrv.com/v1/ads.php?idzone=${zoneId}&type=iframe&t=${Date.now()}"></script>
      </div></body></html>`;
    const iframe = document.createElement('iframe');
    iframe.src = `data:text/html;base64,${btoa(html)}`;
    iframe.style.cssText = 'width:100%;height:250px;border:0;display:block;';
    iframe.loading = 'lazy';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    container.appendChild(iframe);
  }

  private async createDynamicIframe(zoneId: string, container: HTMLElement): Promise<void> {
    const iframe = document.createElement('iframe');
    iframe.src = `https://s.magsrv.com/v1/iframe.php?idzone=${zoneId}`;
    iframe.style.cssText = 'width:100%;height:250px;border:0;display:block;';
    iframe.loading = 'lazy';
    container.appendChild(iframe);
  }

  private async loadImageAd(zoneId: string, container: HTMLElement): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const img = document.createElement('img');
      img.src = `https://s.magsrv.com/v1/banner.php?idzone=${zoneId}&type=image`;
      img.style.cssText = 'max-width:100%;height:auto;display:block;';
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('img load failed'));
      container.appendChild(img);
    });
  }

  private async loadBase64Ad(zoneId: string, container: HTMLElement): Promise<void> {
    const canvas = document.createElement('canvas');
    canvas.width = 300; canvas.height = 250;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas unsupported');
    ctx.fillStyle = '#f0f0f0'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#666'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Advertisement', 150, 125);
    const img = document.createElement('img');
    img.src = canvas.toDataURL();
    img.style.cssText = 'max-width:100%;height:auto;display:block;cursor:pointer;';
    img.onclick = () => window.open(`https://s.magsrv.com/v1/click.php?idzone=${zoneId}`, '_blank');
    container.appendChild(img);
  }

  private async createShadowDomAd(zoneId: string, container: HTMLElement): Promise<void> {
    const host = document.createElement('div');
    host.style.cssText = 'width:100%;height:250px;display:block;';
    const shadow = (host as any).attachShadow?.({ mode: 'closed' });
    if (!shadow) throw new Error('shadow unsupported');
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <style>
        .shadow-ad{width:100%;height:250px;background:linear-gradient(45deg,#f0f0f0,#e0e0e0);
        display:flex;align-items:center;justify-content:center;font-family:sans-serif;border:1px solid #ddd;cursor:pointer}
      </style>
      <div class="shadow-ad">Advertisement</div>`;
    shadow.appendChild(wrap);
    (wrap.querySelector('.shadow-ad') as HTMLDivElement).onclick = () =>
      window.open(`https://s.magsrv.com/v1/click.php?idzone=${zoneId}`, '_blank');
    container.appendChild(host);
  }

  private async loadTextAd(zoneId: string, container: HTMLElement): Promise<void> {
    const box = document.createElement('div');
    box.innerHTML = `
      <div style="padding:16px;background:#f7f7f7;border:1px solid #ddd;text-align:center;">
        <p style="margin:0 0 6px;color:#666;font:14px/1.3 sans-serif">Advertisement</p>
        <a href="https://s.magsrv.com/v1/click.php?idzone=${zoneId}" target="_blank" rel="nofollow noopener" style="text-decoration:none;">Support our content</a>
      </div>`;
    container.appendChild(box);
  }

  private async loadWebWorkerAd(zoneId: string, container: HTMLElement): Promise<void> {
    if (!('Worker' in window)) throw new Error('worker unsupported');
    await new Promise<void>((resolve, reject) => {
      const workerScript = `
        self.onmessage = e => {
          const z = e.data.zoneId;
          const content = '<div style="width:300px;height:250px;background:linear-gradient(45deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-family:sans-serif;cursor:pointer;" onclick="window.open(\\\\'https://s.magsrv.com/v1/click.php?idzone=' + z + '\\\\', \\\\'_blank\\\\')">Advertisement</div>';
          self.postMessage({ content });
        };`;
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      const timeout = setTimeout(() => { worker.terminate(); reject(new Error('worker timeout')); }, 3000);
      worker.onmessage = (e) => {
        clearTimeout(timeout);
        const div = document.createElement('div');
        div.innerHTML = e.data.content;
        container.appendChild(div);
        worker.terminate();
        resolve();
      };
      worker.onerror = () => { clearTimeout(timeout); worker.terminate(); reject(new Error('worker error')); };
      worker.postMessage({ zoneId });
    });
  }

  private async loadServiceWorkerAd(zoneId: string, container: HTMLElement): Promise<void> {
    if (!('serviceWorker' in navigator)) throw new Error('sw unsupported');

    // NOTE: Many browsers restrict blob SW registration. Expect failures.
    await new Promise<void>((resolve, reject) => {
      const swScript = `
        self.addEventListener('message', e => {
          if (e.data?.type === 'AD_REQUEST') {
            const z = e.data.zoneId;
            e.ports[0].postMessage({
              type:'AD_RESPONSE',
              content:'<div style="width:300px;height:250px;background:linear-gradient(45deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;color:#fff;font-family:sans-serif;cursor:pointer;" onclick="window.open(\\\\'https://s.magsrv.com/v1/click.php?idzone=' + z + '\\\\', \\\\'_blank\\\\')">SW Advertisement</div>'
            });
          }
        });`;
      const blob = new Blob([swScript], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      navigator.serviceWorker.register(url).then(reg => {
        const ch = new MessageChannel();
        ch.port1.onmessage = (ev) => {
          if (ev.data?.type === 'AD_RESPONSE') {
            const d = document.createElement('div');
            d.innerHTML = ev.data.content;
            container.appendChild(d);
            reg.unregister().finally(() => URL.revokeObjectURL(url));
            resolve();
          }
        };
        const send = () => reg.active?.postMessage({ type: 'AD_REQUEST', zoneId }, [ch.port2]);
        if (reg.active) send();
        else {
          const t = setTimeout(() => { reg.unregister().finally(() => URL.revokeObjectURL(url)); reject(new Error('sw inactive')); }, 1500);
          const int = setInterval(() => {
            if (reg.active) { clearInterval(int); clearTimeout(t); send(); }
          }, 100);
        }
      }).catch(() => reject(new Error('sw register failed')));
    });
  }

  private async createVideoOverlayAd(zoneId: string, container: HTMLElement): Promise<void> {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:relative;width:100%;height:250px;background:linear-gradient(135deg,#1a1a1a,#2d2d2d);
      border-radius:8px;overflow:hidden;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.3)`;
    const content = document.createElement('div');
    content.style.cssText = `position:absolute;inset:0 0 40px 0;display:flex;align-items:center;justify-content:center;color:#fff;font:700 18px/1.2 sans-serif;background:linear-gradient(45deg,#667eea,#764ba2)`;
    content.textContent = '▶ Sponsored Content';
    const controls = document.createElement('div');
    controls.style.cssText = `position:absolute;left:0;right:0;bottom:0;height:40px;background:rgba(0,0,0,.8);display:flex;align-items:center;padding:0 12px;color:#fff;font:12px sans-serif`;
    controls.innerHTML = `<div style="width:20px;height:20px;margin-right:8px">▶</div><div style="margin-left:auto">0:30 / 0:30</div>`;
    overlay.append(content, controls);
    overlay.onclick = () => window.open(`https://s.magsrv.com/v1/click.php?idzone=${zoneId}&type=video`, '_blank');
    container.appendChild(overlay);
  }

  private async createOperaMiniBypass(zoneId: string, container: HTMLElement): Promise<void> {
    const isOperaMini = /Opera Mini|OPIM/i.test(navigator.userAgent);
    if (!isOperaMini) throw new Error('not opera mini');
    const el = document.createElement('div');
    el.style.cssText = `width:300px;height:250px;background-image:linear-gradient(45deg,#ff6b6b,#4ecdc4);position:relative;border-radius:6px;overflow:hidden;cursor:pointer;margin:0 auto`;
    const inner = document.createElement('div');
    inner.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;text-align:center;font:bold 16px sans-serif;text-shadow:1px 1px 2px rgba(0,0,0,.5)`;
    inner.innerHTML = `<div style="margin-bottom:6px">Advertisement</div><div style="font-size:12px;opacity:.9">Tap to continue</div>`;
    el.appendChild(inner);
    const click = () => setTimeout(() => {
      window.open(`https://s.magsrv.com/v1/click.php?idzone=${zoneId}&browser=operamini&t=${Date.now()}`, '_blank');
    }, 50);
    el.addEventListener('click', click);
    el.addEventListener('touchstart', click);
    container.appendChild(el);
  }
}

export const adBlockerDetector = AdBlockerDetector.getInstance();