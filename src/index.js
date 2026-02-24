import express from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectToDatabase } from './lib/db.js';
import slackRoutes from './routes/slack.js';
import githubRoutes from './routes/github.js';
import dashboardRoutes from './routes/dashboard.js';
import { register } from './lib/metrics.js';
import logger from './lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load default .env if present, then fallback to config/local.env
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../config/local.env') });

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('tiny'));

// Capture rawBody for Slack signature verification
app.use(bodyParser.urlencoded({
  extended: true,
  verify: (req, res, buf) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString('utf8');
    }
  }
}));

app.use(bodyParser.json({
  verify: (req, res, buf) => {
    if (buf && buf.length && !req.rawBody) {
      req.rawBody = buf.toString('utf8');
    }
  }
}));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);

// Health endpoint for bot
app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

// FIX-006: Expose Prometheus /metrics endpoint
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    logger.error('Failed to generate metrics', { error: err.message });
    res.status(500).end('Error generating metrics');
  }
});

// Mount routers
app.use('/slack', slackRoutes);
app.use('/github', githubRoutes);

// FIX-016: Mount dashboard route
app.use('/dashboard', dashboardRoutes);

const port = process.env.PORT || 3000;

async function start() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (mongoUri) {
    try {
      await connectToDatabase(mongoUri);
      logger.info('Connected to MongoDB');
    } catch (err) {
      logger.error('MongoDB connection failed', { error: err.message });
    }
  }

  app.listen(port, () => {
    logger.info(`ChatOps bot listening on port ${port}`);
  });
}

start();
