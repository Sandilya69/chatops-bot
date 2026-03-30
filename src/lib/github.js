import { withRetry } from './retry.js';
import { redactToken } from './security.js';

const baseUrl = 'https://api.github.com';

function ghHeaders() {
  const token = process.env.GITHUB_TOKEN;
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };
}

// ---------------------------------------------------------------------------
// Helper: fetch JSON safely – verify content‑type before calling .json()
// ---------------------------------------------------------------------------
async function safeFetch(url, options = {}) {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const txt = await res.text();
    throw new Error(`GitHub API returned non‑JSON (content‑type: ${contentType}). Status: ${res.status}. URL: ${url}\nResponse body: ${txt}`);
  }
  return res;
}

export async function triggerWorkflow({ service, env, version, ref = 'main', repoInfo, workflowId = 'deploy.yml' }) {
  const owner = repoInfo?.owner || process.env.GITHUB_OWNER;
  const repo = repoInfo?.repo || process.env.GITHUB_REPO;
  
  const url = `${baseUrl}/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`;
  const body = { ref, inputs: { service, env, version } };

  console.log(`[GH] Dispatch URL: ${url}`);
  console.log(`[GH] Owner: ${owner}, Repo: ${repo}, Token: [REDACTED]`);

  const dispatchTime = new Date().toISOString();
  const dispatchRes = await fetch(url, { method: 'POST', headers: ghHeaders(), body: JSON.stringify(body) });
  
  if (!dispatchRes.ok) {
    const errText = await dispatchRes.text();
    console.error(`[GH] Dispatch failed: ${dispatchRes.status} ${errText}`);
    throw new Error(`GitHub dispatch failed (${dispatchRes.status}): ${errText}`);
  }
  
  console.log(`[GH] Dispatch success (204). Looking for new run...`);

  // Poll for the new workflow run (created after our dispatch)
  // Use general runs endpoint — filtering by workflow filename can miss runs
  const runsUrl = `${baseUrl}/repos/${owner}/${repo}/actions/runs?event=workflow_dispatch&per_page=5`;
  
  for (let attempt = 0; attempt < 10; attempt++) {
    await new Promise(r => setTimeout(r, attempt === 0 ? 2000 : 2000));
    const res = await safeFetch(runsUrl, { headers: ghHeaders() });
    const data = await res.json();
    const runs = data?.workflow_runs || [];
    // Find a run created after our dispatch
    const newRun = runs.find(r => new Date(r.created_at) >= new Date(dispatchTime));
    if (newRun?.id) {
      console.log(`[GH] Found run ID: ${newRun.id} (status: ${newRun.status})`);
      return newRun.id;
    }
    console.log(`[GH] Attempt ${attempt + 1}/10: no new run yet...`);
  }
  return null;
}

export async function getRunStatus(runId, repoInfo) {
  const owner = repoInfo?.owner || process.env.GITHUB_OWNER;
  const repo = repoInfo?.repo || process.env.GITHUB_REPO;
  const url = `${baseUrl}/repos/${owner}/${repo}/actions/runs/${runId}`;
  const res = await withRetry(() => safeFetch(url, { headers: ghHeaders() }), { retries: 3 });
  // safeFetch already throws on non‑JSON, so we only need to check HTTP status here
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub getRunStatus failed: ${res.status} ${txt}`);
  }
  return res.json();
}

