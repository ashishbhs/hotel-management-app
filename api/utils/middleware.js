import { RateLimiterMemory } from 'rate-limiter-flexible';
import helmet from 'helmet';

// Rate limiting configuration
const rateLimitOptions = {
  // General API limits
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: {
    error: 'Too many requests. Please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  // Skip successful requests (only count failed ones)
  skipSuccessfulRequests: false,
  
  // Custom key generator for better tracking
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           'unknown';
  }
};

// Stricter limits for sensitive endpoints
const strictRateLimitOptions = {
  ...rateLimitOptions,
  max: 10, // 10 requests per minute for POST/PUT/DELETE
  windowMs: 1 * 60 * 1000,
};

// Rate limiting middleware
export const rateLimitMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.headers['x-forwarded-for'] || req.connection.remoteAddress);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: secs
    });
  }
};

// Enhanced security middleware
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://*.supabase.co"],
    },
  },
  crossOriginEmbedderPolicy: false
});

// Request logging middleware
export const loggingMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Error handling middleware
export const errorHandler = (error, req, res, next) => {
  console.error('API Error:', error);
  
  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: isDevelopment ? error.details : 'Invalid input data'
    });
  }
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      details: isDevelopment ? error.message : 'Authentication required'
    });
  }
  
  if (error.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      error: 'Resource already exists',
      details: 'A record with this data already exists'
    });
  }
  
  if (error.code === 'PGRST116') { // PostgREST not found
    return res.status(404).json({
      error: 'Resource not found',
      details: 'The requested resource does not exist'
    });
  }
  
  // Default error response
  res.status(500).json({
    error: 'Internal server error',
    details: isDevelopment ? error.message : 'Something went wrong'
  });
};

// Request validation middleware
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.validatedBody = value;
    next();
  };
};

// Query validation middleware
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        error: 'Query validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.validatedQuery = value;
    next();
  };
};

// CORS middleware factory
export const createCorsMiddleware = (allowedOrigins) => {
  return (req, res, next) => {
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    next();
  };
};

// Health check middleware
export const healthCheck = (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
};

// API version middleware
export const apiVersion = (version) => {
  return (req, res, next) => {
    res.setHeader('API-Version', version);
    next();
  };
};

// Request ID middleware
export const requestId = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(2, 15);
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// Enhanced rate limiting with different limits for different methods
export const enhancedRateLimit = async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection.remoteAddress || 
             'unknown';
  
  // Stricter limits for write operations
  const isWriteOperation = ['POST', 'PUT', 'DELETE'].includes(req.method);
  const maxRequests = isWriteOperation ? 10 : 30; // 10 write ops, 30 read ops per minute
  
  try {
    await rateLimiter.consume(ip, maxRequests);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again in ${secs} seconds.`,
      retryAfter: secs
    });
  }
};

// Request size limiting to prevent large payloads
export const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxSize = 1024 * 1024; // 1MB limit
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      error: 'Request too large',
      message: 'Maximum request size is 1MB'
    });
  }
  
  next();
};

// Simple in-memory cache for GET requests
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const cacheMiddleware = (req, res, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }
  
  const key = `${req.url}-${JSON.stringify(req.query)}`;
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json(cached.data);
  }
  
  // Override res.json to cache the response
  const originalJson = res.json;
  res.json = function(data) {
    cache.set(key, { data, timestamp: Date.now() });
    
    // Clean up old cache entries
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

export default {
  rateLimitMiddleware,
  securityMiddleware,
  loggingMiddleware,
  errorHandler,
  validateRequest,
  validateQuery,
  createCorsMiddleware,
  healthCheck,
  apiVersion,
  requestId,
  compressionCheck
};
