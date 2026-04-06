import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { appConfig } from './config/app';
import { pool } from './config/database';
import routes from './routes';
import { redisClient } from './config/redis';
import { requestLogger } from './middlewares/requestLogger.middleware';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { logger } from './config/logger';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@config/swagger';
import client from 'prom-client';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
    try {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
        });
    } catch (err: any) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
            error: err.message,
        });
    }
});

// Metrics
app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

// Logger middleware 
app.use(requestLogger);

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (_req, res) => {
    res.json(swaggerSpec);
});

// Routes
app.use(`/api/${appConfig.apiVersion}`, routes);

// Error handler
app.use(errorHandler);

app.listen(appConfig.port, async () => {
    logger.info(`Server running on port ${appConfig.port}`, { env: process.env.NODE_ENV });

    // DB connect
    try {
        await pool.query('SELECT 1');
        logger.info('Database connected');
    } catch (err: any) {
        logger.error('Database not available:', err.message);
        logger.error('Server is running but database features will return errors');
    }

    // Redis connect
    try {
        await redisClient.connect();
    } catch (err: any) {
        logger.error('Redis not available:', err.message);
        logger.error('Server is running but caching features will be degraded');
    }
});


export default app;