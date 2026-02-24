// FIX-009: Single source of truth — getUserRole lives in rbac.js
import { getUserRole } from './rbac.js';

export { getUserRole };

export function isAuthorizedForDeploy(role) {
  return role === 'admin' || role === 'developer';
}

export async function hasRole(userId, roleName) {
  const role = await getUserRole(userId);
  return role === roleName;
}
