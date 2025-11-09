import AuditLog from '../models/AuditLog.js';

export async function logAudit(action, user, details = {}) {
  try {
    if (AuditLog) {
      await AuditLog.create({ action, user, details });
      return;
    }
  } catch {}
  // eslint-disable-next-line no-console
  console.log('[AUDIT]', action, user, details);
}


