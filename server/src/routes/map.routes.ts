import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { mapboxClient } from '../server';

const router = Router();

// Rate limiting for map endpoints
const mapRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // More generous for map requests
  message: {
    success: false,
    message: 'Too many map requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all map routes
router.use(mapRateLimit);

/**
 * GET /api/map/geocode
 * Forward geocoding: address/place → coordinates
 */
router.get('/geocode', async (req: Request, res: Response) => {
  try {
    const { query, country = 'ET', limit = 5 } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required',
      });
    }

    if (!mapboxClient) {
      return res.status(503).json({
        success: false,
        message: 'Mapbox service is not available',
      });
    }

    const endpoint = `/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
    const params = {
      country,
      limit: parseInt(limit as string, 10),
      types: 'place,locality,neighborhood,address',
    };

    const data = await mapboxClient.request(endpoint, params);

    res.json({
      success: true,
      data: {
        features: data.features,
        query: query,
        attribution: data.attribution,
      },
    });

  } catch (error: any) {
    console.error('Geocoding error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Geocoding request failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/map/reverse-geocode
 * Reverse geocoding: coordinates → address/place
 */
router.get('/reverse-geocode', async (req: Request, res: Response) => {
  try {
    const { longitude, latitude, types = 'place,locality,neighborhood' } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude parameters are required',
      });
    }

    if (!mapboxClient) {
      return res.status(503).json({
        success: false,
        message: 'Mapbox service is not available',
      });
    }

    const endpoint = `/geocoding/v5/mapbox.places/${longitude},${latitude}.json`;
    const params = {
      types: types as string,
      limit: 1,
    };

    const data = await mapboxClient.request(endpoint, params);

    res.json({
      success: true,
      data: {
        features: data.features,
        coordinates: { longitude: parseFloat(longitude as string), latitude: parseFloat(latitude as string) },
        attribution: data.attribution,
      },
    });

  } catch (error: any) {
    console.error('Reverse geocoding error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Reverse geocoding request failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/map/directions
 * Get directions between two points
 */
router.get('/directions', async (req: Request, res: Response) => {
  try {
    const { 
      start, 
      end, 
      profile = 'driving', 
      alternatives = 'false',
      geometries = 'geojson',
      overview = 'full'
    } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: 'Start and end coordinates are required (format: "lng,lat")',
      });
    }

    if (!mapboxClient) {
      return res.status(503).json({
        success: false,
        message: 'Mapbox service is not available',
      });
    }

    const endpoint = `/directions/v5/mapbox/${profile}/${start};${end}`;
    const params = {
      alternatives,
      geometries,
      overview,
      steps: 'true',
    };

    const data = await mapboxClient.request(endpoint, params);

    res.json({
      success: true,
      data: {
        routes: data.routes,
        waypoints: data.waypoints,
        code: data.code,
      },
    });

  } catch (error: any) {
    console.error('Directions error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Directions request failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/map/places
 * Search for places near a location
 */
router.get('/places', async (req: Request, res: Response) => {
  try {
    const { 
      query, 
      proximity, 
      bbox, 
      country = 'ET',
      types = 'poi',
      limit = 10 
    } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required',
      });
    }

    if (!mapboxClient) {
      return res.status(503).json({
        success: false,
        message: 'Mapbox service is not available',
      });
    }

    const endpoint = `/geocoding/v5/mapbox.places/${encodeURIComponent(query as string)}.json`;
    const params = {
      country,
      types,
      limit: parseInt(limit as string, 10),
      ...(proximity && { proximity }),
      ...(bbox && { bbox }),
    };

    const data = await mapboxClient.request(endpoint, params);

    res.json({
      success: true,
      data: {
        features: data.features,
        query: query,
        attribution: data.attribution,
      },
    });

  } catch (error: any) {
    console.error('Places search error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Places search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/map/static
 * Generate static map image URL (returns URL, not image)
 */
router.get('/static', async (req: Request, res: Response) => {
  try {
    const { 
      longitude, 
      latitude, 
      zoom = 12, 
      width = 600, 
      height = 400,
      style = 'streets-v12',
      markers = ''
    } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude parameters are required',
      });
    }

    if (!mapboxClient) {
      return res.status(503).json({
        success: false,
        message: 'Mapbox service is not available',
      });
    }

    // Build static map URL
    let staticMapUrl = `${mapboxClient.baseURL}/styles/v1/mapbox/${style}/static`;
    
    // Add markers if provided
    if (markers) {
      staticMapUrl += `/${markers}`;
    }
    
    // Add center, zoom, and dimensions
    staticMapUrl += `/${longitude},${latitude},${zoom}/${width}x${height}`;
    
    // Add access token
    staticMapUrl += `?access_token=${mapboxClient.token}`;

    res.json({
      success: true,
      data: {
        url: staticMapUrl,
        parameters: {
          center: { longitude: parseFloat(longitude as string), latitude: parseFloat(latitude as string) },
          zoom: parseInt(zoom as string, 10),
          dimensions: { width: parseInt(width as string, 10), height: parseInt(height as string, 10) },
          style,
        },
      },
    });

  } catch (error: any) {
    console.error('Static map error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Static map generation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/map/health
 * Check Mapbox service health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isAvailable = !!mapboxClient;
    
    // Test with a simple geocoding request if available
    let testResult = null;
    if (isAvailable) {
      try {
        const testData = await mapboxClient.request('/geocoding/v5/mapbox.places/addis%20ababa.json', { limit: 1 });
        testResult = testData.features?.length > 0 ? 'success' : 'no_results';
      } catch (testError) {
        testResult = 'error';
      }
    }

    res.json({
      success: true,
      data: {
        status: isAvailable ? 'healthy' : 'unavailable',
        service: 'mapbox',
        testResult,
        timestamp: new Date().toISOString(),
        endpoints: {
          geocode: '/api/map/geocode',
          reverseGeocode: '/api/map/reverse-geocode',
          directions: '/api/map/directions',
          places: '/api/map/places',
          static: '/api/map/static',
        },
      },
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;