import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom Metrics
export const deploymentCounter = new client.Counter({
  name: 'chatops_deployments_total',
  help: 'Total number of deployments triggered',
  labelNames: ['service', 'env', 'status'],
  registers: [register]
});

export const deploymentDuration = new client.Histogram({
  name: 'chatops_deployment_duration_seconds',
  help: 'Duration of deployment workflows',
  labelNames: ['service', 'env'],
  buckets: [1, 5, 15, 30, 60, 120, 300], // buckets in seconds
  registers: [register]
});

export const activeDeploymentsGauge = new client.Gauge({
  name: 'chatops_active_deployments',
  help: 'Number of currently running deployments',
  labelNames: ['env'],
  registers: [register]
});

export { register };
