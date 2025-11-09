import { withRetry } from './retry.js';

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

export async function triggerWorkflow({ service, env, version, ref = 'main' }) {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const url = `${baseUrl}/repos/${owner}/${repo}/actions/workflows/deploy.yml/dispatches`;
  const body = { ref, inputs: { service, env, version } };

  await withRetry(() => fetch(url, { method: 'POST', headers: ghHeaders(), body: JSON.stringify(body) }), {
    retries: 3,
    onRetry: (e, i) => console.warn(`[GH] dispatch retry ${i}:`, e?.message)
  });

  // Try to locate the newest workflow run for this workflow
  const runsUrl = `${baseUrl}/repos/${owner}/${repo}/actions/workflows/deploy.yml/runs?event=workflow_dispatch&per_page=1`;
  const res = await withRetry(() => fetch(runsUrl, { headers: ghHeaders() }), { retries: 3 });
  const data = await res.json();
  const run = data?.workflow_runs?.[0];
  return run?.id || null;
}

export async function getRunStatus(runId) {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const url = `${baseUrl}/repos/${owner}/${repo}/actions/runs/${runId}`;
  const res = await withRetry(() => fetch(url, { headers: ghHeaders() }), { retries: 3 });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub getRunStatus failed: ${res.status} ${txt}`);
  }
  return res.json();
}


