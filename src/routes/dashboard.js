import express from 'express';
import mongoose from 'mongoose';
import ActiveDeploy from '../models/ActiveDeploy.js';
import AuditLog from '../models/AuditLog.js';
import CommandAudit from '../models/CommandAudit.js';
import Role from '../models/Role.js';
import Service from '../models/Service.js';

const router = express.Router();

// ── API endpoints for dashboard data ──
router.get('/api/stats', async (req, res) => {
  try {
    const [totalDeploys, successDeploys, failedDeploys, inProgress, totalCommands, totalRoles, totalServices] = await Promise.all([
      ActiveDeploy.countDocuments(),
      ActiveDeploy.countDocuments({ status: 'completed' }),
      ActiveDeploy.countDocuments({ status: 'failed' }),
      ActiveDeploy.countDocuments({ status: 'in_progress' }),
      CommandAudit.countDocuments(),
      Role.countDocuments(),
      Service.countDocuments(),
    ]);
    res.json({
      totalDeploys, successDeploys, failedDeploys, inProgress, totalCommands, totalRoles, totalServices,
      successRate: totalDeploys ? ((successDeploys / totalDeploys) * 100).toFixed(1) : '0.0',
      dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/deploys', async (req, res) => {
  try {
    const deploys = await ActiveDeploy.find().sort({ startedAt: -1 }).limit(50).lean();
    res.json(deploys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/audit', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(50).lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/commands', async (req, res) => {
  try {
    const cmds = await CommandAudit.find().sort({ timestamp: -1 }).limit(50).lean();
    res.json(cmds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/roles', async (req, res) => {
  try {
    const roles = await Role.find().lean();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/services', async (req, res) => {
  try {
    const services = await Service.find().lean();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Dashboard HTML ──
router.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ChatOps Bot — Live Dashboard</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: #0f0f23;
      color: #e0e0e0;
      min-height: 100vh;
    }

    .header {
      background: linear-gradient(135deg, #1a1a3e 0%, #2d1b69 50%, #1a1a3e 100%);
      padding: 24px 32px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header h1 {
      font-size: 22px;
      font-weight: 700;
      background: linear-gradient(90deg, #7c3aed, #a78bfa, #38bdf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .header .db-badge {
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .db-connected   { background: rgba(52,211,153,0.2); color: #34d399; border: 1px solid rgba(52,211,153,0.3); }
    .db-disconnected { background: rgba(248,113,113,0.2); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      padding: 24px 32px;
    }
    .stat-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      transition: transform 0.2s, border-color 0.2s;
    }
    .stat-card:hover { transform: translateY(-2px); border-color: rgba(124,58,237,0.4); }
    .stat-value { font-size: 32px; font-weight: 700; color: #a78bfa; }
    .stat-label { font-size: 12px; text-transform: uppercase; color: #9ca3af; margin-top: 4px; letter-spacing: 1px; }
    .stat-card.success .stat-value { color: #34d399; }
    .stat-card.danger  .stat-value { color: #f87171; }
    .stat-card.warning .stat-value { color: #fbbf24; }
    .stat-card.info    .stat-value { color: #38bdf8; }

    .container { padding: 0 32px 32px; }

    .tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .tab-btn {
      padding: 10px 20px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.03);
      color: #9ca3af;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .tab-btn:hover { border-color: rgba(124,58,237,0.4); color: #e0e0e0; }
    .tab-btn.active {
      background: rgba(124,58,237,0.2);
      border-color: #7c3aed;
      color: #a78bfa;
    }

    .tab-content { display: none; }
    .tab-content.active { display: block; }

    table {
      width: 100%;
      border-collapse: collapse;
      background: rgba(255,255,255,0.03);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.08);
    }
    th {
      background: rgba(124,58,237,0.15);
      color: #a78bfa;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 14px 16px;
      text-align: left;
    }
    td {
      padding: 12px 16px;
      font-size: 13px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    tr:hover { background: rgba(255,255,255,0.03); }

    .badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-success   { background: rgba(52,211,153,0.15); color: #34d399; }
    .badge-failed    { background: rgba(248,113,113,0.15); color: #f87171; }
    .badge-progress  { background: rgba(251,191,36,0.15); color: #fbbf24; }
    .badge-admin     { background: rgba(124,58,237,0.2); color: #a78bfa; }
    .badge-developer { background: rgba(56,189,248,0.15); color: #38bdf8; }
    .badge-tester    { background: rgba(52,211,153,0.15); color: #34d399; }
    .badge-viewer    { background: rgba(156,163,175,0.15); color: #9ca3af; }

    .refresh-info {
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      padding: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: #6b7280;
    }
    .empty-state .icon { font-size: 48px; margin-bottom: 12px; }

    @media (max-width: 768px) {
      .header, .stats-grid, .container { padding-left: 16px; padding-right: 16px; }
    }
  </style>
</head>
<body>

<div class="header">
  <h1>🤖 ChatOps Bot — Live Dashboard</h1>
  <span id="dbBadge" class="db-badge db-disconnected">⏳ Checking...</span>
</div>

<div class="stats-grid">
  <div class="stat-card"><div class="stat-value" id="statTotal">--</div><div class="stat-label">Total Deploys</div></div>
  <div class="stat-card success"><div class="stat-value" id="statSuccess">--</div><div class="stat-label">Successful</div></div>
  <div class="stat-card danger"><div class="stat-value" id="statFailed">--</div><div class="stat-label">Failed</div></div>
  <div class="stat-card warning"><div class="stat-value" id="statActive">--</div><div class="stat-label">In Progress</div></div>
  <div class="stat-card info"><div class="stat-value" id="statRate">--%</div><div class="stat-label">Success Rate</div></div>
  <div class="stat-card"><div class="stat-value" id="statCommands">--</div><div class="stat-label">Commands Used</div></div>
  <div class="stat-card"><div class="stat-value" id="statRoles">--</div><div class="stat-label">Users with Roles</div></div>
</div>

<div class="container">
  <div class="tabs">
    <button class="tab-btn active" onclick="showTab('deploys')">📦 Deployments</button>
    <button class="tab-btn" onclick="showTab('commands')">⌨️ Commands</button>
    <button class="tab-btn" onclick="showTab('audit')">📋 Audit Log</button>
    <button class="tab-btn" onclick="showTab('roles')">🔐 RBAC Roles</button>
    <button class="tab-btn" onclick="showTab('services')">⚙️ Services</button>
  </div>

  <div id="tab-deploys" class="tab-content active"></div>
  <div id="tab-commands" class="tab-content"></div>
  <div id="tab-audit" class="tab-content"></div>
  <div id="tab-roles" class="tab-content"></div>
  <div id="tab-services" class="tab-content"></div>
</div>

<div class="refresh-info">Auto-refreshes every 30 seconds · <span id="lastRefresh">--</span></div>

<script>
function showTab(name) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  event.target.classList.add('active');
}

function statusBadge(s) {
  if (s === 'completed' || s === 'success') return '<span class="badge badge-success">' + s + '</span>';
  if (s === 'failed' || s === 'error')      return '<span class="badge badge-failed">' + s + '</span>';
  if (s === 'in_progress')                  return '<span class="badge badge-progress">' + s + '</span>';
  return '<span class="badge">' + (s || 'unknown') + '</span>';
}

function roleBadge(r) {
  return '<span class="badge badge-' + (r || 'viewer') + '">' + (r || 'none') + '</span>';
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString();
}

function emptyState(msg) {
  return '<div class="empty-state"><div class="icon">📭</div><p>' + msg + '</p></div>';
}

async function loadDashboard() {
  try {
    // Stats
    const stats = await (await fetch('/dashboard/api/stats')).json();
    document.getElementById('statTotal').textContent = stats.totalDeploys;
    document.getElementById('statSuccess').textContent = stats.successDeploys;
    document.getElementById('statFailed').textContent = stats.failedDeploys;
    document.getElementById('statActive').textContent = stats.inProgress;
    document.getElementById('statRate').textContent = stats.successRate + '%';
    document.getElementById('statCommands').textContent = stats.totalCommands;
    document.getElementById('statRoles').textContent = stats.totalRoles;

    const badge = document.getElementById('dbBadge');
    if (stats.dbStatus === 'connected') {
      badge.textContent = '🟢 MongoDB Connected';
      badge.className = 'db-badge db-connected';
    } else {
      badge.textContent = '🔴 MongoDB Disconnected';
      badge.className = 'db-badge db-disconnected';
    }

    // Deployments
    const deploys = await (await fetch('/dashboard/api/deploys')).json();
    if (deploys.length === 0) {
      document.getElementById('tab-deploys').innerHTML = emptyState('No deployments yet. Run /deploy in Discord to get started!');
    } else {
      let html = '<table><thead><tr><th>Correlation ID</th><th>Service</th><th>Env</th><th>Version</th><th>User</th><th>Status</th><th>Started</th></tr></thead><tbody>';
      deploys.forEach(d => {
        html += '<tr><td><code>' + (d.correlationId || '-').substring(0,8) + '...</code></td><td>' + (d.service||'-') + '</td><td>' + (d.env||'-') + '</td><td>' + (d.version||'-') + '</td><td>' + (d.userId||'-') + '</td><td>' + statusBadge(d.status) + '</td><td>' + formatDate(d.startedAt) + '</td></tr>';
      });
      html += '</tbody></table>';
      document.getElementById('tab-deploys').innerHTML = html;
    }

    // Commands
    const cmds = await (await fetch('/dashboard/api/commands')).json();
    if (cmds.length === 0) {
      document.getElementById('tab-commands').innerHTML = emptyState('No command history yet.');
    } else {
      let html = '<table><thead><tr><th>Command</th><th>User</th><th>Status</th><th>Meta</th><th>Time</th></tr></thead><tbody>';
      cmds.forEach(c => {
        const meta = c.meta ? JSON.stringify(c.meta) : '-';
        html += '<tr><td><code>' + (c.command||'-') + '</code></td><td>' + (c.userId||'-') + '</td><td>' + statusBadge(c.status) + '</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + meta + '</td><td>' + formatDate(c.timestamp) + '</td></tr>';
      });
      html += '</tbody></table>';
      document.getElementById('tab-commands').innerHTML = html;
    }

    // Audit
    const audit = await (await fetch('/dashboard/api/audit')).json();
    if (audit.length === 0) {
      document.getElementById('tab-audit').innerHTML = emptyState('No audit log entries yet.');
    } else {
      let html = '<table><thead><tr><th>Action</th><th>User</th><th>Details</th><th>Time</th></tr></thead><tbody>';
      audit.forEach(a => {
        const details = a.details ? JSON.stringify(a.details) : '-';
        html += '<tr><td>' + (a.action||'-') + '</td><td>' + (a.user||'-') + '</td><td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + details + '</td><td>' + formatDate(a.timestamp) + '</td></tr>';
      });
      html += '</tbody></table>';
      document.getElementById('tab-audit').innerHTML = html;
    }

    // Roles
    const roles = await (await fetch('/dashboard/api/roles')).json();
    if (roles.length === 0) {
      document.getElementById('tab-roles').innerHTML = emptyState('No roles assigned yet. Use /addrole in Discord.');
    } else {
      let html = '<table><thead><tr><th>User ID</th><th>Role</th></tr></thead><tbody>';
      roles.forEach(r => {
        html += '<tr><td><code>' + (r.userId||'-') + '</code></td><td>' + roleBadge(r.role) + '</td></tr>';
      });
      html += '</tbody></table>';
      document.getElementById('tab-roles').innerHTML = html;
    }

    // Services
    const services = await (await fetch('/dashboard/api/services')).json();
    if (services.length === 0) {
      document.getElementById('tab-services').innerHTML = emptyState('No services registered yet. Use /addservice in Discord.');
    } else {
      let html = '<table><thead><tr><th>Name</th><th>Repository</th><th>Workflow</th><th>Environments</th></tr></thead><tbody>';
      services.forEach(s => {
        html += '<tr><td><strong>' + (s.name||'-') + '</strong></td><td><code>' + (s.repo||'-') + '</code></td><td><code>' + (s.workflow_id||'deploy.yml') + '</code></td><td>' + (s.envs ? s.envs.join(', ') : 'any') + '</td></tr>';
      });
      html += '</tbody></table>';
      document.getElementById('tab-services').innerHTML = html;
    }

    document.getElementById('lastRefresh').textContent = 'Last refresh: ' + new Date().toLocaleTimeString();
  } catch (err) {
    console.error('Dashboard load error:', err);
    document.getElementById('dbBadge').textContent = '🔴 Error: ' + err.message;
    document.getElementById('dbBadge').className = 'db-badge db-disconnected';
  }
}

loadDashboard();
setInterval(loadDashboard, 30000);
</script>
</body>
</html>`);
});

export default router;
