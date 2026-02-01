import express from 'express';
import ActiveDeploy from '../models/ActiveDeploy.js';

const router = express.Router();

router.post('/webhook', async (req, res) => {
  const event = req.header('X-GitHub-Event');
  const payload = req.body;

  if (event === 'workflow_run') {
    const run = payload.workflow_run;
    const status = run.status;
    const conclusion = run.conclusion;
    const runId = run.id;

    console.log(`[Webhook] Workflow ${runId} update: ${status} (${conclusion})`);

    // Step 5: Update MongoDB and Notify Discord
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
      console.error('[Webhook] Error processing event:', err);
    }
  }

  res.status(200).send('OK');
});

export default router;


