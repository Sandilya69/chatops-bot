/**
 * Security utilities for the ChatOps Deployment Bot
 * Provides HTML escaping, input validation, and token redaction
 */

// ── HTML Escaping (prevents XSS in dashboard) ──
const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

export function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"'/]/g, char => HTML_ESCAPE_MAP[char]);
}

// ── Input Validation ──
const SERVICE_NAME_REGEX = /^[a-z0-9][a-z0-9_-]{0,49}$/;
const GITHUB_OWNER_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
const GITHUB_REPO_REGEX = /^[a-zA-Z0-9._-]{1,100}$/;
const WORKFLOW_FILE_REGEX = /^[a-zA-Z0-9._-]{1,100}\.yml$/;
const DISCORD_ID_REGEX = /^\d{17,20}$/;

export function validateServiceName(name) {
  if (!name || !SERVICE_NAME_REGEX.test(name)) {
    return { valid: false, error: 'Service name must be 1-50 chars, lowercase letters, numbers, hyphens, underscores. Must start with letter or number.' };
  }
  return { valid: true };
}

export function validateGitHubOwner(owner) {
  if (!owner || !GITHUB_OWNER_REGEX.test(owner)) {
    return { valid: false, error: 'Invalid GitHub owner/org name.' };
  }
  return { valid: true };
}

export function validateGitHubRepo(repo) {
  if (!repo || !GITHUB_REPO_REGEX.test(repo)) {
    return { valid: false, error: 'Invalid GitHub repository name.' };
  }
  return { valid: true };
}

export function validateWorkflowFile(workflow) {
  if (!workflow || !WORKFLOW_FILE_REGEX.test(workflow)) {
    return { valid: false, error: 'Workflow must be a valid .yml filename.' };
  }
  return { valid: true };
}

export function validateDiscordId(id) {
  if (!id || !DISCORD_ID_REGEX.test(id)) {
    return { valid: false, error: 'Invalid Discord user ID. Must be 17-20 digits.' };
  }
  return { valid: true };
}

// ── Token Redaction (for safe logging) ──
export function redactToken(token) {
  if (!token) return '[NOT SET]';
  if (token.length <= 8) return '****';
  return token.substring(0, 4) + '****' + token.substring(token.length - 4);
}

export function redactUri(uri) {
  if (!uri) return '[NOT SET]';
  // Hide password in mongodb+srv://user:PASSWORD@host
  return uri.replace(/:([^@/]+)@/, ':****@');
}
