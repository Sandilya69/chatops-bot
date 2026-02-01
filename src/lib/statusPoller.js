import { getRunStatus } from './github.js';
import { withRetry } from './retry.js';

const POLL_INTERVAL = 10000; // 10 seconds
const MAX_ATTEMPTS = 90; // 15 minutes max

/**
 * Polls GitHub for the status of a workflow run until it completes or times out.
 * @param {string} runId - The GitHub Action run ID
 * @param {object} repoInfo - { owner, repo }
 * @param {function} onUpdate - Optional callback for status updates (e.g., logging)
 * @returns {Promise<string>} - Final conclusion ('success', 'failure', 'cancelled', etc.)
 */
export async function pollWorkflowStatus(runId, repoInfo, onUpdate) {
  if (typeof repoInfo === 'function') {
      onUpdate = repoInfo;
      repoInfo = null;
  }
  let attempt = 0;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    
    // Fetch status
    let data;
    try {
      data = await getRunStatus(runId, repoInfo);
    } catch (e) {
      console.warn(`[Poller] Failed to fetch status for ${runId}: ${e.message}`);
      // Continue polling even if one request fails
    }

    if (data) {
      const status = data.status; // 'queued', 'in_progress', 'completed'
      const conclusion = data.conclusion; // 'success', 'failure', 'cancelled', 'timed_out', etc.

      if (status === 'completed') {
        return conclusion;
      }
      
      if (onUpdate) {
        onUpdate(status);
      }
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
  }

  throw new Error('Workflow polling timed out.');
}
