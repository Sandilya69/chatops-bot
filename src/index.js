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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load default .env if present, then fallback to config/local.env
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../config/local.env') });

const app = express();

app.use(helmet());
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

// Mount routers
app.use('/slack', slackRoutes);
app.use('/github', githubRoutes);

const port = process.env.PORT || 3000;

async function start() {
  if (process.env.MONGODB_URI) {
    try {
      await connectToDatabase(process.env.MONGODB_URI);
      // eslint-disable-next-line no-console
      console.log('Connected to MongoDB');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('MongoDB connection failed:', err.message);
    }
  }

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`ChatOps bot listening on port ${port}`);
  });
}

start();


