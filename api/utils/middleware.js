import { RateLimiterMemory } from 'rate-limiter-flexible';
import helmet from 'helmet';

// Rate limiting configuration
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.headers['x-forwarded-for'] || req.connection.remoteAddress,
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 60, // Block for 60 seconds if limit exceeded
});

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

// Compression check middleware (for Vercel)
export const compressionCheck = (req, res, next) => {
  // Vercel handles compression automatically
  // This middleware can be used for custom compression if needed
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
