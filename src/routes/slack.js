import express from 'express';

const router = express.Router();

router.post('/command', (req, res) => {
  res.status(200).send('Slack integration is currently in legacy mode. Please use Discord slash commands.');
});

router.post('/interactions', (req, res) => {
  res.status(200).send('Interaction received');
});

export default router;
