import CommandAudit from '../models/CommandAudit.js';
import { isDbConnected } from './dbState.js';

export async function logCommand(userId, command, status) {
  try {
    if (!isDbConnected()) {
      // eslint-disable-next-line no-console
      console.log('[AUDIT][NO-DB]', { userId, command, status });
      return;
    }
    await CommandAudit.create({ userId, command, status });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[AUDIT_LOG_FAIL]', err.message);
  }
}


