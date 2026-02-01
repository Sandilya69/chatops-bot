const limits = new Map();

/**
 * Basic in-memory rate limiter for Discord commands
 * @param {string} userId
 * @param {string} service
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - true if allowed, false if limited
 */
export function isRateLimited(userId, service, windowMs = 30000) {
    const key = `${userId}:${service}`;
    const now = Date.now();
    const last = limits.get(key) || 0;

    if (now - last < windowMs) {
        return true;
    }

    limits.set(key, now);
    return false;
}

export function getRemainingCooldown(userId, service, windowMs = 30000) {
    const key = `${userId}:${service}`;
    const now = Date.now();
    const last = limits.get(key) || 0;
    const diff = now - last;
    return Math.max(0, Math.ceil((windowMs - diff) / 1000));
}
