import { Request, Response, NextFunction } from 'express';

// In-memory cache for geocoding queries with 24-hour TTL
interface CacheEntry {
  data: any;
  timestamp: number;
}

const geocodeCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Upstream rate-limiting timestamp to respect Nominatim policy (1 request per second)
let lastUpstreamRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 1100;

export const geocodeAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = String(req.query.q || '').trim();

    if (!query || query.length < 3) {
      res.status(400).json({
        success: false,
        message: 'Search query must be at least 3 characters long.',
      });
      return;
    }

    const cacheKey = query.toLowerCase();

    // Check cache
    const cached = geocodeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      res.status(200).json({
        success: true,
        source: 'cache',
        data: cached.data,
      });
      return;
    }

    // Rate-limiting throttler to respect OSM Nominatim usage policy
    const now = Date.now();
    const waitTime = Math.max(0, MIN_REQUEST_INTERVAL_MS - (now - lastUpstreamRequestTime));
    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    lastUpstreamRequestTime = Date.now();

    // Query Nominatim API with countrycodes=in (India) and custom User-Agent
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&addressdetails=1&limit=5&countrycodes=in`;

    const upstreamResponse = await fetch(url, {
      headers: {
        'User-Agent': 'HomeFinder-RealEstate/1.0 (contact: support@homefinder.local)',
        'Accept-Language': 'en',
      },
    });

    if (!upstreamResponse.ok) {
      res.status(502).json({
        success: false,
        message: 'Upstream geocoding service unavailable.',
      });
      return;
    }

    const rawResults: any = await upstreamResponse.json();

    const results = (Array.isArray(rawResults) ? rawResults : []).map((item: any) => ({
      placeId: item.place_id,
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: item.address,
      type: item.type,
    }));

    // Cache results
    geocodeCache.set(cacheKey, {
      data: { results },
      timestamp: Date.now(),
    });

    res.status(200).json({
      success: true,
      source: 'live',
      data: { results },
    });
  } catch (error) {
    next(error);
  }
};
