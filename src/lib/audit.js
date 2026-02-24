import AuditLog from '../models/AuditLog.js';
import { isDbConnected } from './dbState.js';
import logger from './logger.js';

export async function logAudit(action, user, details = {}) {
  try {
    if (!isDbConnected()) {
      logger.warn('[AUDIT][NO-DB]', { action, user, details });
      return;
    }
    await AuditLog.create({ action, user, details });
  } catch (err) {
    logger.error('[AUDIT_FAIL]', { error: err.message, action, user });
  }
}
