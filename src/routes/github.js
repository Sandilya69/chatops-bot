import express from 'express';

const router = express.Router();

router.post('/webhook', (req, res) => {
  // TODO: verify GitHub signature if configured
  // TODO: process workflow_run and workflow_job events
  res.status(200).send('OK');
});

export default router;


