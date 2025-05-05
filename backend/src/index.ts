import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import passport from 'passport';
import swaggerUi from 'swagger-ui-express';
import config from './config';
import { setupPassport } from './middlewares/passport';
import { requestLogger } from './middlewares/requestLogger';
import routes from './routes';
import { logger } from './utils/logger';
import { db } from './services/database/database.factory';

// Initialize database
db.initialize()
  .then(() => {
    logger.info('Database initialized successfully');
    startServer();
  })
  .catch((err) => {
    logger.error('Database initialization error:', err);
    process.exit(1);
  });

function startServer() {
  // Initialize Express app
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors({
    origin: config.frontendUrl,
    credentials: true,
  }));
  // Request logging middleware - add before other middleware to log all requests
  app.use(requestLogger);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Session configuration
  app.use(session({
    secret: config.jwtSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());
  setupPassport();

  // Set up routes
  app.use(routes);

  // Set up TSOA generated routes (conditionally if file exists)
  try {
    // Try to dynamically import the RegisterRoutes function
    const { RegisterRoutes } = require('./build/routes');
    if (typeof RegisterRoutes === 'function') {
      RegisterRoutes(app);
      logger.info('TSOA routes registered successfully');
    }
  } catch (error) {
    logger.warn('TSOA routes not registered:', error instanceof Error ? error.message : String(error));
  }

  // Serve Swagger UI
  try {
    const YAML = require('yamljs');
    const path = require('path');
    const swaggerDocument = YAML.load(path.resolve(__dirname, '../../common/src/schema/swagger.yaml'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    logger.info('Swagger UI available at /api-docs');
  } catch (error) {
    logger.error('Unable to load swagger documentation', error);
  }

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.stack);
    res.status(500).json({
      message: 'An unexpected error occurred',
      error: config.nodeEnv === 'development' ? err.message : undefined
    });
  });

  // Graceful shutdown
  const gracefulShutdown = async () => {
    logger.info('Shutting down server...');
    
    // Close database connection
    await db.close();
    
    process.exit(0);
  };

  // Handle process termination
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // Start the server
  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  });

  return app;
}

// For testing
export default startServer();
