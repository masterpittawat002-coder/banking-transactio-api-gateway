import client from 'prom-client';

// เก็บ default metrics (memory, CPU, event loop lag)
client.collectDefaultMetrics();

// Custom metrics
export const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'path', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const httpRequestTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status_code'],
});

export const dbPoolActiveConnections = new client.Gauge({
    name: 'db_pool_active_connections',
    help: 'Number of active database connections',
});