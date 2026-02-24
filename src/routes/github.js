import express from 'express';
import crypto from 'crypto';
import ActiveDeploy from '../models/ActiveDeploy.js';
import logger from '../lib/logger.js';

const router = express.Router();

// FIX-004: GitHub webhook signature verification
function verifyGitHubSignature(req, res, next) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return next(); // skip verification if secret not configured

  const sig = req.headers['x-hub-signature-256'];
  if (!sig) {
    logger.warn('[Webhook] Missing X-Hub-Signature-256 header');
    return res.status(401).json({ error: 'Missing signature' });
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');

  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(digest))) {
      logger.warn('[Webhook] Invalid signature', { received: sig });
      return res.status(401).json({ error: 'Invalid signature' });
    }
  } catch {
    logger.warn('[Webhook] Signature comparison failed');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
}

router.post('/webhook', verifyGitHubSignature, async (req, res) => {
  const event = req.header('X-GitHub-Event');
  const payload = req.body;

  if (event === 'workflow_run') {
    const run = payload.workflow_run;
    const status = run.status;
    const conclusion = run.conclusion;
    const runId = run.id;

    logger.info(`[Webhook] Workflow ${runId} update: ${status} (${conclusion})`);

    // Update MongoDB and Notify Discord
    try {
      const deploy = await ActiveDeploy.findOne({ workflowRunId: runId });
      if (deploy && status === 'completed') {
          deploy.status = conclusion === 'success' ? 'completed' : 'failed';
          await deploy.save();

          if (req.discordClient && deploy.threadId && deploy.channelId) {
              const channel = await req.discordClient.channels.fetch(deploy.channelId);
              if (channel && channel.threads) {
                  const thread = await channel.threads.fetch(deploy.threadId).catch(() => null);
                  if (thread) {
                      const emoji = conclusion === 'success' ? '✅' : '❌';
                      await thread.send(`${emoji} **GitHub Notification:** Workflow ${runId} finished with **${conclusion}**.`);
                  }
              }
          }
      }
    } catch (err) {
      logger.error('[Webhook] Error processing event', { error: err.message, runId });
    }
  }

  res.status(200).send('OK');
});

export default router;
