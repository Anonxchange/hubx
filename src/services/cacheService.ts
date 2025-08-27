interface CacheItem<T> {
  data: T;
  timestamp: number;
  expires: number;
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private readonly defaultTTL = 10 * 60 * 1000; // 10 minutes

  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      items: Array.from(this.cache.entries()).map(([key, item]) => ({
        key,
        age: Date.now() - item.timestamp,
        ttl: item.expires - Date.now()
      }))
    };
  }
}

export const cacheService = new CacheService();

// Auto cleanup every 5 minutes
setInterval(() => {
  cacheService.cleanup();
}, 5 * 60 * 1000);


// Cache service for optimizing data loading
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Video cache specifically for fast loading
interface VideoCache {
  videos: any[];
  totalCount: number;
  totalPages: number;
  page: number;
  category?: string;
  searchQuery?: string;
}

// Video-specific cache for faster homepage loading
const VIDEO_CACHE_KEY = 'homepage_videos_cache';
const VIDEO_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const setVideoCache = (cache: VideoCache) => {
  try {
    const cacheEntry: CacheEntry<VideoCache> = {
      data: cache,
      timestamp: Date.now(),
      expiresAt: Date.now() + VIDEO_CACHE_DURATION
    };
    localStorage.setItem(VIDEO_CACHE_KEY, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error('Error setting video cache:', error);
  }
};

const getVideoCache = (): VideoCache | null => {
  try {
    const cached = localStorage.getItem(VIDEO_CACHE_KEY);
    if (!cached) return null;

    const entry: CacheEntry<VideoCache> = JSON.parse(cached);
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(VIDEO_CACHE_KEY);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('Error getting video cache:', error);
    return null;
  }
};

const clearVideoCache = () => {
  try {
    localStorage.removeItem(VIDEO_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing video cache:', error);
  }
};

export const cacheService = {
  set,
  get,
  delete: cacheService.delete, // Renamed to avoid conflict with delete keyword
  clear: cacheService.clear, // Renamed to avoid conflict with clear keyword
  cleanup: cacheService.cleanup,
  getStats: cacheService.getStats,
  // Video-specific methods
  setVideoCache,
  getVideoCache,
  clearVideoCache
};