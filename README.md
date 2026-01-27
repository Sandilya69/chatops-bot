# 🤖 ChatOps Bot (Discord + GitHub + MongoDB)

[![CI](https://github.com/Sandilya69/chatops-bot/actions/workflows/deploy.yml/badge.svg)](https://github.com/Sandilya69/chatops-bot/actions/workflows/deploy.yml)
![MongoDB](https://img.shields.io/badge/MongoDB-Connected-green?style=flat-square)
![Discord](https://img.shields.io/badge/Discord-Bot%20Online-blue?style=flat-square)

A full-stack ChatOps automation bot built with Node.js, Discord.js, and MongoDB — streamlining DevOps tasks directly from Discord using slash commands. Integrates with GitHub Actions for CI/CD, supports RBAC, approvals, real‑time logs, and metrics.

---

## 🚀 Features

- /ping — Health check
- /deploy — Trigger GitHub Actions workflow runs (with approvals for prod)
- /status — Fetch GitHub Actions run status
- /metrics — Analytics from MongoDB audit logs (Total, Success, Failed, Success Rate)
- RBAC (admin/developer/viewer), cooldown, idempotency
- Threaded logs + staged progress + health check

---

## 🏗️ Architecture

Discord Slash Commands → Node.js (Discord.js)
↓
MongoDB (roles, audit_logs, active_deploys)
↓
GitHub Actions (dispatch + status)

Code layout: `src/commands`, `src/lib`, `src/models` (ESM).

---

## ⚙️ Tech

| Stack | Tech |
|---|---|
| Language | Node.js 18+ |
| Framework | discord.js v14 |
| DB | MongoDB Atlas (mongoose) |
| CI/CD | GitHub Actions |
| Env | dotenv |

---

## 📁 Structure

```
chatops-bot/
├─ src/
│  ├─ bot.js
│  ├─ commands/
│  │  ├─ ping.js
│  │  ├─ deploy.js
│  │  ├─ status.js
│  │  └─ metrics.js
│  ├─ lib/
│  │  ├─ github.js
│  │  ├─ retry.js
│  │  └─ dbState.js
│  └─ models/
│     ├─ Role.js
│     ├─ CommandAudit.js
│     └─ ActiveDeploy.js
├─ config/local.env
├─ deploy-commands.js
└─ package.json
```

---

## 🔧 Environment

Create `config/local.env`:

```
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
MONGODB_URI=mongodb+srv://...
GITHUB_TOKEN=your_github_pat_token
GITHUB_OWNER=Sandilya69
GITHUB_REPO=chatops-bot
```

---

## 💬 Slash Commands

| Command | Role |
|---|---|
| /ping | Everyone |
| /deploy | Developer/Admin (prod needs admin approval) |
| /status | Everyone |
| /metrics | Admin |

---

## ▶️ Run Locally

```
npm install
npm run deploy:commands
npm start
```

---

## 🐳 Run with Docker

### Quick Start
```bash
# Using Docker Compose (recommended)
docker-compose up -d

# Or using Docker CLI
docker build -t chatops-bot .
docker run -d --name chatops-bot --env-file config/local.env -p 3000:3000 chatops-bot
```

### View Logs
```bash
docker-compose logs -f
# or
docker logs -f chatops-bot
```

See [DOCKER_GUIDE.md](DOCKER_GUIDE.md) for complete Docker deployment instructions.

---

## 🧾 Examples

- /ping → 🏓 Pong!
- /deploy service:api env:dev version:v1 → ✅ Deployment completed
- /status run_id:19066230916 → 🟢 completed / success
- /metrics → 📊 Total: 6 • ✅ 6 • ❌ 0 • 📈 100%

---

## 🔒 Roles (MongoDB)

```
db.roles.insertOne({ userId: "1434794266948927634", role: "admin" })
```

---

## 🏁 Roadmap

- Prometheus /metrics endpoint
- Docker deployment
- Auto-resume deploys end-to-end
- PagerDuty/Jira integration

---

## 🏷️ License

MIT © 2025 Rituraj Tripathi
