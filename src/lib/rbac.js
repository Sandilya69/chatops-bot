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
  
  if (role === 'admin') return true; // Admins can do everything

  if (env === 'dev') {
    return role === 'developer' || role === 'tester';
  }

  if (env === 'staging') {
    return role === 'tester'; // Only testers/admins can touch staging
  }

  if (env === 'prod') {
    return false; // Only admins (handled above) can touch prod
  }

  return false;
}


