import express from 'express';

const router = express.Router();

// Slack support stub — full implementation coming in v2.0
router.post('/events', (req, res) => {
  res.json({ ok: true, note: 'Slack event support coming in v2.0' });
});

router.post('/command', (req, res) => {
  res.json({
    response_type: 'ephemeral',
    text: '⚠️ Slack commands will be supported in v2.0. Please use Discord for now.'
  });
});

router.post('/interactions', (req, res) => {
  res.sendStatus(200);
});

export default router;
