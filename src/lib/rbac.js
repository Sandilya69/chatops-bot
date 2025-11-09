import Role from '../models/Role.js';

export async function getUserRole(userId) {
  try {
    const rec = await Role.findOne({ userId }).lean();
    return rec?.role || 'viewer';
  } catch {
    return 'viewer';
  }
}

export async function isApprover(userId) {
  const role = await getUserRole(userId);
  return role === 'admin';
}

export async function canDeploy(userId, env) {
  const role = await getUserRole(userId);
  if (env === 'prod') {
    return role === 'admin';
  }
  return role === 'developer' || role === 'admin';
}


