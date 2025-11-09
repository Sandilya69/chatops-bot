export const activeDeployments = new Set(); // keys: `${service}:${env}`
export const cooldownUntil = new Map(); // key -> timestamp
export const pendingApprovals = new Map(); // correlationId -> payload

export function keyFor(service, env) {
  return `${service}:${env}`;
}

export function isInCooldown(service, env) {
  const key = keyFor(service, env);
  const until = cooldownUntil.get(key) || 0;
  return Date.now() < until;
}

export function setCooldown(service, env, ms) {
  const key = keyFor(service, env);
  cooldownUntil.set(key, Date.now() + ms);
}


