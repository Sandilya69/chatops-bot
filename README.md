<div align="center">

# 🤖 ChatOps Deployment Bot

### Enterprise-grade DevOps Automation through Discord

[![CI](https://github.com/Sandilya69/chatops-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/Sandilya69/chatops-bot/actions/workflows/ci.yml)
[![Deploy](https://github.com/Sandilya69/chatops-bot/actions/workflows/deploy.yml/badge.svg)](https://github.com/Sandilya69/chatops-bot/actions/workflows/deploy.yml)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-Metrics-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**Trigger deployments · Manage RBAC roles · Approve production releases · Monitor CI/CD pipelines**
<br/>
*All without leaving your Discord server.*

[Getting Started](#-getting-started) · [Commands](#-slash-commands) · [Architecture](#-architecture) · [Docker](#-docker-deployment) · [Contributing](#-contributing)

</div>

---

## 📑 Table of Contents

<details>
<summary>Click to expand</summary>

- [Highlights](#-highlights)
- [Architecture](#-architecture)
  - [High-Level System Design](#high-level-system-design)
  - [Deployment Flow Sequence](#deployment-flow-sequence)
- [How It Works — Deployment Flow](#-how-it-works--deployment-flow)
- [Slash Commands](#-slash-commands)
  - [Command Reference](#command-reference)
  - [Command Examples](#command-examples)
- [RBAC (Role-Based Access Control)](#-rbac-role-based-access-control)
  - [Permission Matrix](#permission-matrix)
  - [Production Approval Gate](#production-approval-gate)
- [Live Dashboard](#-live-dashboard)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#1-clone--install)
  - [Configuration](#2-configure-environment)
  - [Register Commands](#3-register-slash-commands)
- [Running the Bot](#-running-the-bot)
  - [Development Mode](#development-mode)
  - [Production Mode](#production-mode)
  - [API Endpoints](#api-endpoints)
- [Docker Deployment](#-docker-deployment)
- [Database Schema](#-database-schema)
- [Monitoring & Observability](#-monitoring--observability)
  - [Prometheus Metrics](#prometheus-metrics)
  - [Winston Logging](#winston-logging)
- [Testing](#-testing)
- [Security](#-security)
- [Environment Variables](#-environment-variables)
- [Troubleshooting](#-troubleshooting)
- [Implementation Status](#-implementation-status)
- [Roadmap (v2.0)](#-roadmap-v20)
- [Contributing](#-contributing)
- [License](#-license)

</details>

---

## ✨ Highlights

<table>
<tr>
<td width="50%">

### 🚀 One-Command Deployments
Deploy any registered service to **dev / staging / prod** straight from Discord with `/deploy`. The bot handles GitHub Actions orchestration end-to-end.

### 🔐 Production Approval Gates
Production deployments require an **admin to approve** via interactive buttons. Requests auto-expire after **30 minutes**.

### 🛡️ 4-Tier RBAC
**Admin → Developer → Tester → Viewer** with environment-scoped permissions. All role data persisted in MongoDB.

</td>
<td width="50%">

### 📊 Real-Time Dashboard
A live web dashboard at `localhost:3000/dashboard` shows deployments, commands, audit logs, roles, and services — auto-refreshes every 30 seconds.

### 📈 Prometheus Metrics
Production-grade `/metrics` endpoint with deployment counts, duration histograms, active deploy gauges, and Node.js runtime stats.

### ↩️ Instant Rollback
One-click rollback to the last successful deployment with a confirmation UI and full audit trail.

</td>
</tr>
</table>

| Feature | Description |
|:--------|:------------|
| 🔄 **GitHub Actions Integration** | Triggers `workflow_dispatch` events, polls run status every 10 s, and receives webhooks for real-time updates |
| 📋 **Full Audit Trail** | Every action — deploys, approvals, rejections, role changes — logged to MongoDB with correlation IDs |
| 🏢 **Multi-Service Registry** | Register unlimited GitHub repos as deployable services via `/addservice` |
| ⚡ **Rate Limiting** | Per-user + per-service cooldowns prevent accidental double-deploys |
| 🔁 **Retry with Backoff** | GitHub API calls auto-retry with configurable exponential backoff |
| 📝 **Structured Logging** | Winston JSON logs (Splunk / ELK ready) in production, colorized output in development |
| 🐳 **Docker Ready** | Dockerfile + docker-compose.yml with health checks, non-root user, and log rotation |

---

## 🏗️ Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CHATOPS BOT SYSTEM                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────┐     ┌───────────────────────────────────┐               │
│   │  Discord  │────▶│        Bot Entry (bot.js)         │               │
│   │   Users   │◀────│  • Command Router                 │               │
│   │          │     │  • Button Interaction Handler      │               │
│   └──────────┘     │  • Approval Workflow Engine        │               │
│                     └──────────┬──────────┬─────────────┘               │
│                                │          │                              │
│              ┌─────────────────┘          └──────────────┐              │
│              ▼                                            ▼              │
│   ┌─────────────────┐                         ┌─────────────────┐      │
│   │  Command Layer   │                         │  Express Server  │      │
│   │  (10 Commands)   │                         │  (index.js)      │      │
│   │                   │                         │                   │      │
│   │  /deploy          │                         │  GET /health      │      │
│   │  /rollback        │                         │  GET /metrics     │      │
│   │  /audit           │                         │  GET /dashboard   │      │
│   │  /status          │                         │  POST /github/*   │      │
│   │  /addrole         │                         │  POST /slack/*    │      │
│   │  /deleterole      │                         └────────┬──────────┘      │
│   │  /viewroles       │                                  │              │
│   │  /addservice      │                                  │              │
│   │  /metrics         │                                  │              │
│   │  /ping            │                                  │              │
│   └────────┬──────────┘                                  │              │
│            │                                              │              │
│            ▼                                              ▼              │
│   ┌─────────────────────────────────────────────────────────────┐      │
│   │                     Library Layer (src/lib/)                 │      │
│   │                                                               │      │
│   │  ┌─────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐  │      │
│   │  │  RBAC   │ │ GitHub   │ │  Status    │ │   Rate       │  │      │
│   │  │ rbac.js │ │ github.js│ │  Poller    │ │  Limiter     │  │      │
│   │  │ roles.js│ │          │ │            │ │              │  │      │
│   │  └─────────┘ └──────────┘ └────────────┘ └──────────────┘  │      │
│   │  ┌─────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐  │      │
│   │  │ Audit   │ │ Metrics  │ │   Retry    │ │   Logger     │  │      │
│   │  │ audit.js│ │prom-client│ │  Backoff  │ │  Winston     │  │      │
│   │  │ cmdAudit│ │          │ │            │ │              │  │      │
│   │  └─────────┘ └──────────┘ └────────────┘ └──────────────┘  │      │
│   │  ┌─────────┐ ┌──────────┐                                    │      │
│   │  │  State  │ │ DB State │                                    │      │
│   │  │ In-Mem  │ │ Mongoose │                                    │      │
│   │  └─────────┘ └──────────┘                                    │      │
│   └───────────────────────────┬─────────────────────────────────┘      │
│                               │                                         │
│                               ▼                                         │
│   ┌─────────────────────────────────────────────────────────────┐      │
│   │                   MongoDB (Atlas / Local)                    │      │
│   │                                                               │      │
│   │  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐    │      │
│   │  │ ActiveDeploy │  │    Role    │  │     Service      │    │      │
│   │  │ Deployments  │  │  4 tiers   │  │  Repo registry   │    │      │
│   │  └──────────────┘  └────────────┘  └──────────────────┘    │      │
│   │  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐    │      │
│   │  │  AuditLog    │  │ CmdAudit   │  │  ChannelConfig   │    │      │
│   │  │ Action trail │  │ Cmd history│  │  Channel mapping │    │      │
│   │  └──────────────┘  └────────────┘  └──────────────────┘    │      │
│   └─────────────────────────────────────────────────────────────┘      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │   GitHub Actions    │
                    │   (External CI/CD)  │
                    │                     │
                    │  workflow_dispatch ◀─── Bot triggers deploys
                    │  workflow_run     ──▶ Webhook notifies bot
                    └─────────────────────┘
```

### Deployment Flow Sequence

```
┌──────┐        ┌──────┐       ┌──────┐      ┌────────┐     ┌──────┐
│ User │        │ Bot  │       │ RBAC │      │ GitHub │     │Mongo │
└──┬───┘        └──┬───┘       └──┬───┘      └───┬────┘     └──┬───┘
   │  /deploy      │              │               │             │
   │──────────────▶│              │               │             │
   │               │  Check Role  │               │             │
   │               │─────────────▶│               │             │
   │               │  ✅ Allowed  │               │             │
   │               │◀─────────────│               │             │
   │               │                               │             │
   │               │──── If prod: Show Approve/Reject buttons ──│
   │               │                               │             │
   │  [Approve]    │                               │             │
   │──────────────▶│                               │             │
   │               │  Dispatch workflow_dispatch   │             │
   │               │──────────────────────────────▶│             │
   │               │                               │             │
   │               │  Create ActiveDeploy record   │             │
   │               │──────────────────────────────────────────▶│
   │               │                               │             │
   │               │  Poll status every 10s        │             │
   │               │──────────────────────────────▶│             │
   │               │  ✅ completed                 │             │
   │               │◀──────────────────────────────│             │
   │               │                               │             │
   │               │  Update deploy record         │             │
   │  ✅ Done!     │──────────────────────────────────────────▶│
   │◀──────────────│              │               │             │
```

---

## 🔁 How It Works — Deployment Flow

```mermaid
flowchart TD
    A[User runs /deploy service env version] --> B{RBAC Check}
    B -->|Denied| C[🚫 Permission Error]
    B -->|Allowed| D{Is env = prod?}
    D -->|No| E[Create ActiveDeploy Record]
    D -->|Yes| F[Post Approval Request with Buttons]
    F -->|⏰ 30min timeout| G[Auto-expire & cleanup]
    F -->|✅ Admin Approves| E
    F -->|❌ Admin Rejects| H[Deployment Cancelled]
    E --> I[Trigger GitHub Actions workflow_dispatch]
    I --> J[Poll workflow status every 10s]
    J -->|In Progress| J
    J -->|Completed| K[✅ Update DB + Notify Thread]
    J -->|Failed| L[❌ Update DB + Error Message]
```

<details>
<summary><b>Step-by-step Walkthrough</b></summary>

1. **User invokes** `/deploy service:api env:staging version:v1.2.3`
2. **RBAC check** — the bot queries MongoDB to verify the user's role allows deployment to the requested environment.
3. **Concurrency guard** — if another deployment for the same `service + env` is already in-flight, the request is rejected.
4. **Rate limiter** — per-user / per-service cooldown prevents accidental double-deploys.
5. **Production gate** — if `env = prod`, the bot posts an approval request with **Approve / Reject** buttons. Only admins can interact. The request expires after **30 minutes**.
6. **GitHub Actions dispatch** — the bot calls the GitHub REST API to trigger a `workflow_dispatch` event on the registered repository.
7. **Polling loop** — the bot polls the workflow run status every 10 seconds and posts live updates into a Discord thread.
8. **Completion** — on success or failure, the bot updates the `ActiveDeploy` record in MongoDB, logs an audit event, and edits the original message.

</details>

---

## 💬 Slash Commands

### Command Reference

| Command | Description | Required Role | Cooldown |
|:--------|:------------|:-------------:|:--------:|
| `/ping` | Health check — bot status & your role | Everyone | — |
| `/deploy` | Deploy a service to an environment | Developer+ | 30 s |
| `/rollback` | Revert to last successful deployment | Admin | — |
| `/audit` | View deployment history with rich embeds | Everyone | — |
| `/status` | Check GitHub Actions workflow run status | Everyone | — |
| `/metrics` | Show command usage statistics | Everyone | — |
| `/addrole` | Assign a role to a Discord user | Admin | — |
| `/deleterole` | Remove a user's role | Admin | — |
| `/viewroles` | List all users and their roles | Everyone | — |
| `/addservice` | Register a GitHub repo as a service | Admin | — |

### Command Examples

<details>
<summary><b>🚀 Deploy a service</b></summary>

```
/deploy service:api env:staging version:v1.2.3
```
- Triggers the `deploy.yml` workflow on the registered repo.
- The bot creates a thread and posts live status updates.
- For `prod`, an approval prompt is shown first.

</details>

<details>
<summary><b>↩️ Rollback a service</b></summary>

```
/rollback service:api
```
- Looks up the last successful deployment in MongoDB.
- Shows a confirmation prompt with the target SHA.
- On confirm, re-deploys the old version to `prod`.

</details>

<details>
<summary><b>📋 View audit history</b></summary>

```
/audit service:api limit:10
```
- Returns the last N deployment records as rich Discord embeds.
- Each embed shows correlation ID, environment, version, status, and timestamp.

</details>

<details>
<summary><b>🔍 Check deployment status</b></summary>

```
/status correlation:abc-123
```
- Queries the ActiveDeploy collection by correlation ID.
- Shows the current workflow status and links to GitHub.

</details>

<details>
<summary><b>🛡️ Manage roles</b></summary>

```
/addrole user_id:123456789 role:developer
/deleterole user_id:123456789
/viewroles
```

</details>

<details>
<summary><b>⚙️ Register a service</b></summary>

```
/addservice name:api owner:my-org repo:api-server
```
- Stores the repo as a deployable service in MongoDB.
- The bot uses this mapping for all future `/deploy` commands.

</details>

---

## 🛡️ RBAC (Role-Based Access Control)

### Permission Matrix

| Role | Dev Deploy | Staging Deploy | Prod Deploy | Manage Roles | Manage Services |
|:-----|:----------:|:--------------:|:-----------:|:------------:|:---------------:|
| **Admin** | ✅ | ✅ | ✅ *(approval required)* | ✅ | ✅ |
| **Developer** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Tester** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Viewer** | ❌ | ❌ | ❌ | ❌ | ❌ |

> [!IMPORTANT]
> **Production deployments** always require explicit admin approval via interactive buttons. Approval requests **auto-expire after 30 minutes**.

### Production Approval Gate

```
User runs /deploy service:api env:prod version:v1.0.0
       │
       ▼
┌──────────────────────────────────┐
│  🔐 Approval Required           │
│                                  │
│  Deploy api to prod (v1.0.0)    │
│  Only admins can approve.        │
│  ⏰ Expires in 30 minutes.      │
│                                  │
│  [ ✅ Approve ]  [ ❌ Reject ]  │
└──────────────────────────────────┘
```

- **Approve** → Deployment proceeds; bot triggers GitHub Actions and begins polling.
- **Reject** → Deployment is cancelled; an audit event is logged.
- **Timeout** → After 30 minutes the approval is auto-expired and cleaned up.

---

## 📊 Live Dashboard

The bot serves a **real-time web dashboard** at `http://localhost:3000/dashboard` featuring a dark-themed glassmorphism UI.

| Tab | What It Shows |
|:----|:--------------|
| 📦 **Deployments** | All deployments with correlation ID, service, env, version, status, timestamp |
| ⌨️ **Commands** | Full command execution history with user, status, and metadata |
| 📋 **Audit Log** | System audit trail — approvals, rejections, role changes |
| 🔐 **RBAC Roles** | All users and their assigned roles |
| ⚙️ **Services** | All registered GitHub repos with workflow configurations |

**Stats bar** — Total Deploys · Successful · Failed · In Progress · Success Rate · Commands Used · Users with Roles

> Auto-refreshes every **30 seconds**.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **Runtime** | Node.js 18+ | Server-side JavaScript (ESM) |
| **Bot Framework** | Discord.js v14 | Discord gateway & REST API |
| **HTTP Server** | Express 4 | Webhooks, dashboard, metrics |
| **Database** | MongoDB (Mongoose 8) | Persistent storage |
| **CI/CD** | GitHub Actions | Automated testing & deployments |
| **Monitoring** | Prometheus (`prom-client`) | Custom + default Node.js metrics |
| **Logging** | Winston | Structured JSON logging (file + console) |
| **Security** | Helmet · HMAC SHA-256 | HTTP headers · webhook verification |
| **Testing** | Jest (ESM) | Unit tests with coverage thresholds |
| **Container** | Docker · Docker Compose | Production containerization |
| **Utilities** | uuid · dotenv · morgan | Correlation IDs · env config · HTTP logging |

---

## 📁 Project Structure

```
chatops-bot/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI — Jest tests with coverage on push/PR
│       └── deploy.yml                # CD — build, test, deploy; supports workflow_dispatch
│
├── config/
│   ├── local.env                     # 🔒 Secrets (gitignored)
│   └── validate.js                   # Startup validation for required env vars
│
├── src/
│   ├── bot.js                        # 🤖 Discord bot entry — command router, button handler, Express
│   ├── index.js                      # 🌐 Standalone Express server (alternative entry)
│   │
│   ├── commands/                     # 💬 10 Slash Commands
│   │   ├── deploy.js                 #    Deploy with approval flow + GitHub Actions + polling
│   │   ├── rollback.js               #    Rollback to last successful deployment
│   │   ├── audit.js                  #    Deployment history viewer (rich embeds)
│   │   ├── status.js                 #    GitHub Actions status checker
│   │   ├── metrics.js                #    Command usage statistics
│   │   ├── addrole.js                #    Role assignment (admin only)
│   │   ├── deleterole.js             #    Role removal (admin only)
│   │   ├── viewroles.js              #    Role listing
│   │   ├── addservice.js             #    Service registration (admin only)
│   │   └── ping.js                   #    Health check
│   │
│   ├── lib/                          # ⚙️ Core Libraries
│   │   ├── rbac.js                   #    RBAC engine — getUserRole, canDeploy, isApprover
│   │   ├── roles.js                  #    Role helpers (re-exports from rbac.js)
│   │   ├── github.js                 #    GitHub API — trigger workflows, get run status
│   │   ├── statusPoller.js           #    Poll GitHub Actions every 10 s until completion
│   │   ├── retry.js                  #    Generic retry with exponential backoff
│   │   ├── rateLimiter.js            #    Per-user per-service rate limiter
│   │   ├── state.js                  #    In-memory state (active deploys, cooldowns, approvals)
│   │   ├── metrics.js                #    Prometheus counters, histograms, gauges
│   │   ├── audit.js                  #    Audit event logging to MongoDB
│   │   ├── commandAudit.js           #    Command execution logging with metadata
│   │   ├── db.js                     #    MongoDB connection (Mongoose)
│   │   ├── dbState.js                #    Connection health checker
│   │   └── logger.js                 #    Winston structured logging (JSON / colorized)
│   │
│   ├── models/                       # 📦 Mongoose Schemas
│   │   ├── ActiveDeploy.js           #    Deployment records with status tracking
│   │   ├── AuditLog.js               #    General audit trail
│   │   ├── CommandAudit.js           #    Command exec history with metadata
│   │   ├── Role.js                   #    User roles (admin/developer/tester/viewer)
│   │   ├── Service.js                #    Registered GitHub repos/services
│   │   └── ChannelConfig.js          #    Channel-to-service mapping
│   │
│   ├── routes/                       # 🌍 Express Routes
│   │   ├── github.js                 #    GitHub webhook handler (signature verified)
│   │   ├── dashboard.js              #    Live database dashboard UI
│   │   └── slack.js                  #    Slack integration stub (v2.0)
│   │
│   └── middleware/                   # 🔧 Express Middleware
│
├── tests/
│   ├── commands/
│   │   ├── deploy.test.js            #    Deploy command unit tests
│   │   └── rollback.test.js          #    Rollback command unit tests
│   └── lib/                          #    Library unit tests
│
├── docs/
│   ├── architecture.md               #    Architecture overview
│   ├── data_models.md                #    MongoDB schema documentation
│   └── system_flows.md               #    System flow diagrams
│
├── deploy-commands.js                 # Discord slash command registration script
├── server.js                          # Alternative Express server entry point
├── Dockerfile                         # Production Docker image (Node 18 Alpine)
├── docker-compose.yml                 # Docker Compose with health checks
├── jest.config.js                     # Jest config with 50% coverage threshold
├── DOCKER_GUIDE.md                    # 🐳 Docker deployment guide
├── package.json                       # Dependencies and scripts
└── README.md                          # 📖 You are here
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Minimum Version | Notes |
|:------------|:----------------|:------|
| **Node.js** | 18+ | ESM modules support required |
| **npm** | 9+ | Comes with Node.js |
| **MongoDB** | 6+ | Atlas free tier or local instance |
| **Discord Bot** | — | [Developer Portal](https://discord.com/developers/applications) |
| **GitHub PAT** | — | Scopes: `repo`, `workflow` |

### 1. Clone & Install

```bash
git clone https://github.com/Sandilya69/chatops-bot.git
cd chatops-bot/bot
npm install
```

### 2. Configure Environment

Create `config/local.env` with the following variables:

```env
# ─── Discord ──────────────────────────────────────────
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id

# ─── MongoDB ──────────────────────────────────────────
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/chatops

# ─── GitHub ───────────────────────────────────────────
GITHUB_TOKEN=ghp_your_personal_access_token
GITHUB_OWNER=your-github-org
GITHUB_REPO=your-repo-name

# ─── Optional ─────────────────────────────────────────
PORT=3000                          # Express server port (default: 3001)
GITHUB_WEBHOOK_SECRET=your_secret  # For webhook signature verification
ROOT_USER_ID=your_discord_user_id  # Bypass RBAC (initial setup)
```

> [!WARNING]
> Never commit `config/local.env` to version control. It is already in `.gitignore`.

### 3. Register Slash Commands

```bash
npm run deploy:commands
```

This registers all 10 slash commands with the Discord API. Run this once, or again whenever command definitions change.

---

## ▶️ Running the Bot

### Development Mode

```bash
npm run dev          # Uses nodemon for hot-reload
```

### Production Mode

```bash
npm start            # node src/bot.js
```

### What Starts

When the bot starts, **two servers** spin up simultaneously:

| Server | Port | Purpose |
|:-------|:-----|:--------|
| **Discord Bot** | WebSocket | Handles slash commands & button interactions |
| **Express HTTP** | `3001` (default) | Dashboard, metrics, webhooks |

### API Endpoints

| Endpoint | Method | Description |
|:---------|:------:|:------------|
| `/health` | `GET` | Health check — `{ ok: true, db: 1 }` |
| `/metrics` | `GET` | Prometheus metrics output |
| `/dashboard` | `GET` | Live database dashboard (HTML) |
| `/github/webhook` | `POST` | GitHub webhook receiver (signature verified) |
| `/slack/events` | `POST` | Slack events stub (v2.0) |

---

## 🐳 Docker Deployment

### Quick Start

```bash
# Build and run with Docker Compose
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Build Manually

```bash
docker build -t chatops-bot .
docker run -d \
  --name chatops-bot \
  --env-file config/local.env \
  -p 3000:3000 \
  --restart unless-stopped \
  chatops-bot
```

### Docker Features

| Feature | Detail |
|:--------|:-------|
| **Base Image** | `node:18-alpine` (minimal attack surface) |
| **Non-root User** | `nodejs:1001` — principle of least privilege |
| **Health Check** | `GET /health` every 30 s with 40 s startup grace period |
| **Log Rotation** | JSON file driver, 10 MB max, 3 files |
| **Restart Policy** | `unless-stopped` |

> 📘 For cloud deployment guides (AWS ECS, Google Cloud Run, Azure), see [DOCKER_GUIDE.md](./DOCKER_GUIDE.md).

---

## 🗄️ Database Schema

The bot uses **6 MongoDB collections** via Mongoose:

<details>
<summary><b>ActiveDeploy</b> — Deployment records</summary>

```js
{
  correlationId: String,   // UUID — unique per deployment
  service:       String,   // Service name
  env:           String,   // dev | staging | prod
  version:       String,   // Git tag or SHA
  userId:        String,   // Discord user ID
  startedAt:     Date,     // Timestamp
  status:        String,   // in_progress | completed | failed
  workflowRunId: Number,   // GitHub Actions run ID
  threadId:      String,   // Discord thread ID
  channelId:     String    // Discord channel ID
}
```

</details>

<details>
<summary><b>Role</b> — RBAC user roles</summary>

```js
{
  userId: String,          // Discord user ID
  role:   String           // admin | developer | tester | viewer
}
```

</details>

<details>
<summary><b>Service</b> — Registered GitHub repos</summary>

```js
{
  name:             String,   // Unique service name
  repo:             String,   // "owner/repo" format
  workflow_id:      Mixed,    // Workflow filename or ID
  envs:             [String], // Allowed environments
  allowed_branches: [String]  // Allowed Git branches
}
```

</details>

<details>
<summary><b>AuditLog</b> — Action audit trail</summary>

```js
{
  action:    String,   // deploy_approved | deploy_rejected | ...
  userId:    String,   // Actor Discord ID
  timestamp: Date,
  details:   Object    // Context-specific metadata
}
```

</details>

<details>
<summary><b>CommandAudit</b> — Command execution history</summary>

```js
{
  userId:    String,   // Who ran the command
  command:   String,   // /deploy, /rollback, etc.
  status:    String,   // success | denied | error
  timestamp: Date,
  meta:      Object    // Command arguments & context
}
```

</details>

<details>
<summary><b>ChannelConfig</b> — Channel-to-service mapping</summary>

```js
{
  channelId:      String,
  serviceMapping: Object   // { service: "default_env" }
}
```

</details>

---

## 📈 Monitoring & Observability

### Prometheus Metrics

Access metrics at `GET /metrics` in Prometheus exposition format.

| Metric | Type | Labels | Description |
|:-------|:-----|:-------|:------------|
| `chatops_deployments_total` | Counter | `service`, `env`, `status` | Total deployments triggered |
| `chatops_deployment_duration_seconds` | Histogram | `service`, `env` | Workflow duration (buckets: 1 s – 5 min) |
| `chatops_active_deployments` | Gauge | `env` | Currently running deployments |
| *Default metrics* | Various | — | CPU, memory, event loop lag, GC stats |

**Sample Prometheus scrape config:**

```yaml
scrape_configs:
  - job_name: 'chatops-bot'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: /metrics
    scrape_interval: 15s
```

### Winston Logging

| Mode | Format | Output |
|:-----|:-------|:-------|
| **Development** | Colorized with timestamps | Console |
| **Production** | JSON (Splunk / ELK / CloudWatch ready) | `logs/error.log` + `logs/combined.log` |

---

## 🧪 Testing

```bash
# Run tests with coverage
npm test

# Watch mode
npx jest --watch

# Specific test file
npx jest tests/commands/deploy.test.js
```

| Setting | Value |
|:--------|:------|
| **Framework** | Jest with ESM (`--experimental-vm-modules`) |
| **Coverage Target** | 50% (branches, functions, lines) |
| **Coverage Output** | `coverage/` directory (lcov + text) |
| **CI** | GitHub Actions runs `jest --coverage` on every push/PR |

---

## 🔒 Security

| Feature | Implementation |
|:--------|:---------------|
| **Secrets Management** | All secrets in `config/local.env` (gitignored) — never committed |
| **Webhook Verification** | GitHub webhook signatures verified using HMAC SHA-256 |
| **HTTP Security** | Helmet.js for strict security headers |
| **Rate Limiting** | Express rate limiter (120 req/min) + per-command cooldowns |
| **RBAC** | 4-tier role-based access for all destructive operations |
| **Docker** | Non-root user (`nodejs:1001`), minimal Alpine image |
| **Env Validation** | Startup fails fast if required env vars are missing |
| **Idempotency** | Correlation IDs prevent duplicate deployments |

---

## 🔑 Environment Variables

| Variable | Required | Default | Description |
|:---------|:--------:|:--------|:------------|
| `DISCORD_TOKEN` | ✅ | — | Discord bot authentication token |
| `CLIENT_ID` | ✅ | — | Discord application / client ID |
| `MONGODB_URI` | ✅ | — | MongoDB connection string |
| `GITHUB_TOKEN` | ✅ | — | GitHub PAT (scopes: `repo`, `workflow`) |
| `GITHUB_OWNER` | ✅ | — | GitHub organization or username |
| `GITHUB_REPO` | ✅ | — | Default GitHub repository name |
| `PORT` | ❌ | `3001` | Express server port |
| `GITHUB_WEBHOOK_SECRET` | ❌ | — | Secret for webhook signature verification |
| `ROOT_USER_ID` | ❌ | — | Discord user ID that bypasses RBAC checks |
| `NODE_ENV` | ❌ | — | `production` enables JSON logging |

---

## 🐛 Troubleshooting

<details>
<summary><b>Bot shows offline in Discord</b></summary>

1. Verify `DISCORD_TOKEN` is valid and not expired.
2. Check `CLIENT_ID` matches your application in the Developer Portal.
3. Ensure the bot has been invited to your server with correct permissions.
4. Check logs: `docker logs chatops-bot` or console output.

</details>

<details>
<summary><b>MongoDB connection failed</b></summary>

1. Verify `MONGODB_URI` connection string format.
2. If using Atlas, ensure your IP is whitelisted (or use `0.0.0.0/0` for development).
3. Check that the database user has read/write permissions.
4. Confirm network connectivity to the Atlas cluster.

</details>

<details>
<summary><b>GitHub Actions dispatch fails</b></summary>

1. Verify `GITHUB_TOKEN` has `repo` and `workflow` scopes.
2. Ensure the target repository has a `deploy.yml` workflow file.
3. Check that `GITHUB_OWNER` and `GITHUB_REPO` are correct.
4. Look for detailed error messages in the deployment thread.

</details>

<details>
<summary><b>Slash commands not showing up</b></summary>

1. Run `npm run deploy:commands` to register commands.
2. Discord takes up to 1 hour to propagate global commands (instant for guild commands).
3. Verify `CLIENT_ID` and `DISCORD_TOKEN` are correct.
4. Check the bot has `applications.commands` scope in OAuth2 URL.

</details>

<details>
<summary><b>Health check fails in Docker</b></summary>

1. Ensure port 3000 is exposed and mapped correctly.
2. Test locally: `curl http://localhost:3000/health`
3. Allow the 40 s startup grace period to elapse.
4. Check if MongoDB connection is blocking startup.

</details>

---

## ✅ Implementation Status

### v1.0 — Current Release

- [x] 10 Discord slash commands with full RBAC
- [x] Production approval workflow with 30-minute expiry
- [x] GitHub Actions integration (trigger + poll + webhook)
- [x] MongoDB audit trail with correlation IDs
- [x] Prometheus metrics endpoint
- [x] Live database dashboard (dark-themed UI)
- [x] Winston structured logging wired into all modules
- [x] Rate limiting and cooldown system
- [x] Retry with exponential backoff
- [x] Rollback to last successful deployment
- [x] Multi-service registration
- [x] Docker containerization with health checks
- [x] CI pipeline with Jest coverage thresholds
- [x] GitHub webhook signature verification
- [x] In-flight deployment recovery on restart

<details>
<summary><b>Bug Fixes Applied</b></summary>

| ID | Severity | Description |
|:---|:---------|:------------|
| FIX-001 | 🔴 Critical | Smart quote syntax error in deploy.js |
| FIX-002 | 🔴 Critical | Undefined variable `service` → `serviceName` |
| FIX-003 | 🟠 High | Missing `slack.js` route file |
| FIX-004 | 🟠 High | GitHub webhook signature verification |
| FIX-005 | 🟡 Medium | Winston logger wired into all files |
| FIX-006 | 🟡 Medium | Prometheus `/metrics` endpoint exposed |
| FIX-007 | 🟡 Medium | `/audit` command Discord options added |
| FIX-008 | 🟡 Medium | Approval timeout (30 min auto-expiry) |
| FIX-009 | 🟡 Medium | Duplicate `getUserRole()` consolidated |
| FIX-010 | 🟡 Medium | `ping.js` rewritten cleanly |
| FIX-011 | 🟢 Low | Dead models deleted (Deployment.js, Rbac.js) |
| FIX-012 | 🟢 Low | Unused `@octokit/rest` removed |
| FIX-013 | 🟢 Low | Duplicate if-check in addservice.js |
| FIX-014 | 🟢 Low | CI runs real tests with coverage threshold |
| FIX-015 | 🟢 Low | Failing rollback test string mismatch fixed |
| FIX-016 | 🆕 New | Live database dashboard added |
| FIX-017 | 🆕 New | CommandAudit meta field for context |
| FIX-018 | 🆕 New | All commands log with metadata context |

</details>

---

## 🗺️ Roadmap (v2.0)

| Priority | Feature | Status |
|:--------:|:--------|:------:|
| P0 | Slack adapter (multi-platform support) | 🔜 Planned |
| P0 | HashiCorp Vault / AWS SSM secrets management | 🔜 Planned |
| P0 | Canary deployments (`/canary`, `/promote`) | 🔜 Planned |
| P1 | N-of-M multi-party approval workflows | 🔜 Planned |
| P1 | Multi-repo scoped RBAC | 🔜 Planned |
| P1 | Deployment lifecycle DM notifications | 🔜 Planned |
| P1 | Test coverage ≥ 85% | 🔜 Planned |
| P2 | REST API layer with JWT auth | 🔜 Planned |
| P2 | Grafana dashboard JSON export | 🔜 Planned |
| P2 | E2E tests with Playwright | 🔜 Planned |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create a branch** — `git checkout -b feature/amazing-feature`
3. **Commit** your changes — `git commit -m 'feat: add amazing feature'`
4. **Push** to the branch — `git push origin feature/amazing-feature`
5. **Open a Pull Request**

> Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

```
MIT © 2025 Rituraj Tripathi
```

---

<div align="center">

**Built with ❤️ using Node.js, Discord.js, MongoDB, and GitHub Actions**

[⬆ Back to Top](#-chatops-deployment-bot)

</div>
