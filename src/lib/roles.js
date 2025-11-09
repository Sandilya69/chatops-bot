import Role from '../models/Role.js';

export async function getUserRole(userId) {
  try {
    const rec = await Role.findOne({ userId }).lean();
    return rec?.role || 'viewer';
  } catch {
    return 'viewer';
  }
}

export function isAuthorizedForDeploy(role) {
  return role === 'admin' || role === 'developer';
}


