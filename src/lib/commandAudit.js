import CommandAudit from '../models/CommandAudit.js';
import { isDbConnected } from './dbState.js';
import logger from './logger.js';

export async function logCommand(userId, command, status = 'success', meta = {}) {
  try {
    if (!isDbConnected()) {
      logger.warn('[AUDIT][NO-DB]', { userId, command, status, meta });
      return;
    }
    await CommandAudit.create({ userId, command, status, meta });
  } catch (err) {
    logger.error('[AUDIT_LOG_FAIL]', { error: err.message, userId, command });
  }
}
