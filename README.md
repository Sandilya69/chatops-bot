# 🤖 ChatOps Bot (Discord + GitHub + MongoDB)

[![CI](https://github.com/Sandilya69/chatops-bot/actions/workflows/deploy.yml/badge.svg)](https://github.com/Sandilya69/chatops-bot/actions/workflows/deploy.yml)
![MongoDB](https://img.shields.io/badge/MongoDB-Connected-green?style=flat-square)
![Discord](https://img.shields.io/badge/Discord-Bot%20Online-blue?style=flat-square)

A full-stack, enterprise-grade ChatOps automation bot built with Node.js, Discord.js, and MongoDB. It streamlines DevOps tasks directly from Discord, integrating with GitHub Actions for CI/CD. This project fulfills the **100% Expert-Level Enhancement Guide**.

---

## 🚀 Key Features

- **Multi-Repo Scaling:** Register and deploy any GitHub repository dynamically using MongoDB.
- **Granular RBAC:** Distinct permissions for **Developer**, **Tester**, and **Admin** roles.
- **Safety First:** Production deployments require manual **Admin Approval** via interactive buttons.
- **Real-Time Visibility:** Hybrid monitoring using **GitHub API Polling** and **Webhook listeners** (Port 3010).
- **Disaster Recovery:** A robust **Rollback System** to revert to the last known good version instantly.
- **Hardened Logic:** Command rate limiting, auto-reconnecting MongoDB, and environment validation.

---

## 💬 Slash Commands

| Command       | Description                          | Role Required |
| ------------- | ------------------------------------ | ------------- |
| `/ping`       | Health check & latency               | Everyone      |
| `/deploy`     | Trigger deployment (Poll + Webhooks) | Developer+    |
| `/rollback`   | Emergency revert to last success     | Admin         |
| `/addservice` | Register new GitHub repo dynamically | Admin         |
| `/addrole`    | Assign user permissions              | Admin         |
| `/deleterole` | Remove user permissions              | Admin         |
| `/viewroles`  | List all active roles                | Everyone      |
| `/metrics`    | Success/Failure analytics            | Admin         |
| `/audit`      | Detailed deployment history          | Admin         |
| `/status`     | Check specific GitHub run status     | Everyone      |

---

## 🛡️ Role-Based Access (RBAC)

Our security model follows the **Principle of Least Privilege**:

| Role          | **Dev** Env | **Staging** Env | **Prod** Env     |
| ------------- | ----------- | --------------- | ---------------- |
| **Developer** | ✅          | ❌              | ❌               |
| **Tester**    | ✅          | ✅              | ❌               |
| **Admin**     | ✅          | ✅              | ✅ (w/ Approval) |

---

## 🏗️ Architecture

```mermaid
graph TD
    User([User]) -->|Slash Command| Discord[Discord API]
    Discord -->|Interaction| Bot[ChatOps Bot Node.js]
    Bot -->|Validate| RBAC[RBAC System]
    Bot -->|Lookup| DB[(MongoDB)]
    Bot -->|Dispatch| GHA[GitHub Actions]
    GHA -->|Webhook/Poll| Bot
    Bot -->|Notify| Thread[Discord Thread]
```

---

## 📁 Project Structure

```
chatops-bot/
├─ src/
│  ├─ bot.js             # Main Entry (Discord + Webhook Server)
│  ├─ commands/          # Interactive Slash Commands (10 total)
│  ├─ lib/               # Expert Logic (Polling, Throttling, DB Recovery)
│  ├─ routes/            # Webhook Endpoints
│  └─ models/            # Mongoose Schemas (Services, Roles, Audit)
├─ config/               # Validation & Local Config
└─ tests/                # Jest Unit & Integration Tests
```

---

## 🔧 Installation & Setup

1. **Environment:** Create `config/local.env` with your `DISCORD_TOKEN`, `CLIENT_ID`, `MONGODB_URI`, and `GITHUB_TOKEN`.
2. **Commands:** Sync with Discord:
   ```bash
   npm run deploy:commands
   ```
3. **Start:**
   ```bash
   npm start
   ```

---

## ✅ Expert Enhancement Checklist (100% Complete)

- [x] **Step 1:** Startup Environment Validation
- [x] **Step 2:** Repository Cleanup & Git Optimization
- [x] **Step 3:** Production Approval Governance
- [x] **Step 4:** GitHub Workflow Status Polling
- [x] **Step 5:** Real-time Webhook Integration
- [x] **Step 6:** Command Rate Limiting (Anti-Spam)
- [x] **Step 7:** Robust MongoDB Connection Recovery
- [x] **Step 8:** Automated Rollback Logic
- [x] **Step 9:** Multi-Repo Configuration Support

---

## 🏁 Roadmap

- [ ] PagerDuty / Incident Response Integration
- [ ] Automated Slack Mirroring
- [ ] Containerized Sidecar Metrics (Prometheus)

---

## 🏷️ License

MIT © 2025 Rituraj Tripathi
