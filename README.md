<![CDATA[# 🤖 ChatOps Deployment Bot

[![CI](https://github.com/Sandilya69/chatops-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/Sandilya69/chatops-bot/actions/workflows/ci.yml)
[![Deploy](https://github.com/Sandilya69/chatops-bot/actions/workflows/deploy.yml/badge.svg)](https://github.com/Sandilya69/chatops-bot/actions/workflows/deploy.yml)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=flat-square&logo=discord&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-Metrics-E6522C?style=flat-square&logo=prometheus&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)

> **Enterprise-grade DevOps automation through Discord.** Trigger deployments, manage roles, approve production releases, and monitor CI/CD pipelines — all without leaving your chat.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [How It Works — Deployment Flow](#-how-it-works--deployment-flow)
- [Slash Commands](#-slash-commands)
- [RBAC (Role-Based Access Control)](#-rbac-role-based-access-control)
- [Live Dashboard](#-live-database-dashboard)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Installation & Setup](#-installation--setup)
- [Running the Bot](#-running-the-bot)
- [Docker Deployment](#-docker-deployment)
- [Monitoring & Observability](#-monitoring--observability)
- [Testing](#-testing)
- [Security](#-security)
- [Implementation Status](#-implementation-status)
- [Roadmap (v2.0)](#-roadmap-v20)
- [License](#-license)

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🚀 **One-Command Deployments** | Deploy any registered service to dev/staging/prod via `/deploy` |
| 🔐 **Production Approval Gates** | Prod deploys require admin approval with interactive buttons (auto-expires in 30 min) |
| 🛡️ **4-Tier RBAC** | Admin → Developer → Tester → Viewer with environment-scoped permissions |
| 📊 **Live Dashboard** | Real-time web dashboard at `localhost:3000/dashboard` showing all DB data |
| 📈 **Prometheus Metrics** | Production metrics at `/metrics` — deployment counts, duration, success rates |
| 🔄 **GitHub Actions Integration** | Triggers workflows + polls status + receives webhooks for real-time updates |
| ↩️ **Rollback System** | Instant rollback to last successful deployment with confirmation UI |
| 📋 **Full Audit Trail** | Every action logged to MongoDB with correlation IDs, user, timestamp |
| 🏢 **Multi-Service Registry** | Register unlimited GitHub repos as deployable services |
| ⚡ **Rate Limiting** | Per-user + per-service cooldowns prevent accidental double-deploys |
| 🔁 **Retry with Backoff** | GitHub API calls auto-retry with exponential backoff |
| 📝 **Structured Logging** | Winston JSON logs for production (Splunk/ELK ready), colorized for dev |
| 🐳 **Docker Ready** | Dockerfile + docker-compose.yml with health checks and non-root user |

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

---

## 💬 Slash Commands

| Command | Description | Role Required | Example |
|---------|-------------|---------------|---------|
| `/ping` | Health check — shows bot status & your role | Everyone | `/ping` |
| `/deploy` | Deploy a service to an environment | Developer+ | `/deploy service:api env:staging version:v1.2.3` |
| `/rollback` | Revert to last successful deployment | Admin | `/rollback service:api` |
| `/audit` | View deployment history with rich embeds | Everyone | `/audit service:api limit:10` |
| `/status` | Check GitHub Actions workflow run status | Everyone | `/status correlation:abc-123` |
| `/metrics` | Show command usage statistics | Everyone | `/metrics` |
| `/addrole` | Assign a role to a Discord user | Admin | `/addrole user_id:12345 role:developer` |
| `/deleterole` | Remove a user's role | Admin | `/deleterole user_id:12345` |
| `/viewroles` | List all users and their roles | Everyone | `/viewroles` |
| `/addservice` | Register a GitHub repo as a service | Admin | `/addservice name:api owner:org repo:api-server` |

---

## 🛡️ RBAC (Role-Based Access Control)

The bot enforces **4-tier role-based access control** stored in MongoDB:

```
┌─────────────────────────────────────────────────────────┐
│                    RBAC Permission Matrix                 │
├───────────┬──────────┬──────────┬──────────┬────────────┤
│   Role    │   Dev    │ Staging  │   Prod   │ Manage     │
│           │  Deploy  │  Deploy  │  Deploy  │ Roles      │
├───────────┼──────────┼──────────┼──────────┼────────────┤
│  Admin    │   ✅     │    ✅    │ ✅ ⚠️    │    ✅      │
│           │          │          │(approval)│            │
├───────────┼──────────┼──────────┼──────────┼────────────┤
│ Developer │   ✅     │    ❌    │    ❌    │    ❌      │
├───────────┼──────────┼──────────┼──────────┼────────────┤
│  Tester   │   ✅     │    ✅    │    ❌    │    ❌      │
├───────────┼──────────┼──────────┼──────────┼────────────┤
│  Viewer   │   ❌     │    ❌    │    ❌    │    ❌      │
└───────────┴──────────┴──────────┴──────────┴────────────┘
```

> ⚠️ **Production deployments** require explicit admin approval via interactive buttons. Approval requests **auto-expire after 30 minutes**.

---

## 📊 Live Database Dashboard

The bot serves a **real-time web dashboard** at `http://localhost:3000/dashboard` that displays:

| Tab | What It Shows |
|-----|---------------|
| 📦 **Deployments** | All deployments with correlation ID, service, env, version, status, timestamp |
| ⌨️ **Commands** | Full command execution history with user, status, and metadata |
| 📋 **Audit Log** | System audit trail — approvals, rejections, role changes |
| 🔐 **RBAC Roles** | All users and their assigned roles |
| ⚙️ **Services** | All registered GitHub repos with workflow configurations |

**Stats bar** shows: Total Deploys · Successful · Failed · In Progress · Success Rate · Commands Used · Users with Roles

> Auto-refreshes every 30 seconds. Dark-themed UI with modern glassmorphism design.

---

## 📁 Project Structure

```
chatops-bot/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # CI — runs Jest tests with coverage
│       └── deploy.yml             # CD — builds, tests, deploys bot
│
├── config/
│   ├── local.env                  # 🔒 Environment variables (gitignored)
│   └── validate.js                # Startup validation for required env vars
│
├── src/
│   ├── bot.js                     # 🤖 Main Discord bot entry point
│   ├── index.js                   # 🌐 Express server (dashboard + webhooks + metrics)
│   │
│   ├── commands/                  # 💬 10 Slash Commands
│   │   ├── deploy.js              #    Core deployment logic with approval flow
│   │   ├── rollback.js            #    Emergency rollback system
│   │   ├── audit.js               #    Deployment history viewer
│   │   ├── status.js              #    GitHub Actions status checker
│   │   ├── metrics.js             #    Command usage statistics
│   │   ├── addrole.js             #    Role assignment (admin only)
│   │   ├── deleterole.js          #    Role removal (admin only)
│   │   ├── viewroles.js           #    Role listing
│   │   ├── addservice.js          #    Service registration (admin only)
│   │   └── ping.js                #    Health check
│   │
│   ├── lib/                       # ⚙️ Utility Libraries
│   │   ├── rbac.js                #    RBAC engine — getUserRole, canDeploy, isApprover
│   │   ├── roles.js               #    Role helpers (re-exports from rbac.js)
│   │   ├── github.js              #    GitHub API — trigger workflows, get run status
│   │   ├── statusPoller.js        #    Poll GitHub Actions every 10s until completion
│   │   ├── retry.js               #    Generic retry with exponential backoff
│   │   ├── rateLimiter.js         #    Per-user per-service rate limiter
│   │   ├── state.js               #    In-memory state (active deploys, cooldowns, approvals)
│   │   ├── metrics.js             #    Prometheus counters, histograms, gauges
│   │   ├── audit.js               #    Audit event logging to MongoDB
│   │   ├── commandAudit.js        #    Command execution logging with metadata
│   │   ├── db.js                  #    MongoDB connection via Mongoose
│   │   ├── dbState.js             #    Connection health checker
│   │   └── logger.js              #    Winston structured logging (JSON/colorized)
│   │
│   ├── models/                    # 📦 MongoDB Schemas
│   │   ├── ActiveDeploy.js        #    Deployment records with status tracking
│   │   ├── AuditLog.js            #    General audit trail
│   │   ├── CommandAudit.js        #    Command execution history with metadata
│   │   ├── Role.js                #    User roles (admin/developer/tester/viewer)
│   │   ├── Service.js             #    Registered GitHub repos/services
│   │   └── ChannelConfig.js       #    Channel-to-service mapping
│   │
│   └── routes/                    # 🌍 Express Routes
│       ├── github.js              #    GitHub webhook handler (signature verified)
│       ├── dashboard.js           #    Live database dashboard UI
│       └── slack.js               #    Slack integration stub (v2.0)
│
├── tests/
│   └── commands/
│       ├── deploy.test.js         # Deploy command unit tests
│       └── rollback.test.js       # Rollback command unit tests
│
├── deploy-commands.js             # Discord slash command registration script
├── server.js                      # Alternative Express server entry point
├── Dockerfile                     # Production Docker image (Node 18 Alpine)
├── docker-compose.yml             # Docker Compose with health checks
├── jest.config.js                 # Jest config with 50% coverage threshold
├── package.json                   # Dependencies and scripts
└── README.md                      # 📖 You are here
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 18+ | Server-side JavaScript |
| **Bot Framework** | Discord.js v14 | Discord API interactions |
| **HTTP Server** | Express 4 | Webhooks, dashboard, metrics endpoint |
| **Database** | MongoDB (Mongoose 8) | Persistent storage for all data |
| **CI/CD** | GitHub Actions | Automated testing and deployments |
| **Monitoring** | Prometheus (prom-client) | Deployment metrics and counters |
| **Logging** | Winston | Structured JSON logging (file + console) |
| **Security** | Helmet, HMAC SHA-256 | HTTP headers, webhook signature verification |
| **Testing** | Jest | Unit tests with coverage |
| **Container** | Docker + Docker Compose | Production containerization |

---

## ⚡ Installation & Setup

### Prerequisites

- **Node.js** 18+ and **npm**
- **MongoDB** Atlas cluster or local instance
- **Discord Bot** created at [Discord Developer Portal](https://discord.com/developers/applications)
- **GitHub PAT** with `repo` and `workflow` scopes

### 1. Clone & Install

```bash
git clone https://github.com/Sandilya69/chatops-bot.git
cd chatops-bot/bot
npm install
```

### 2. Configure Environment

Create `config/local.env`:

```env
# Discord
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/chatops

# GitHub
GITHUB_TOKEN=ghp_your_personal_access_token
GITHUB_OWNER=your-github-org
GITHUB_REPO=your-repo-name

# Optional
PORT=3000
GITHUB_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Register Slash Commands

```bash
npm run deploy:commands
```

---

## 🚀 Running the Bot

### Development Mode (with hot reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### What Starts

When you run the bot, two servers start:

| Server | Port | Purpose |
|--------|------|---------|
| **Discord Bot** | WebSocket | Handles slash commands and button interactions |
| **Express HTTP** | 3000 (index.js) / 3001 (bot.js) | Dashboard, metrics, webhooks |

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check — returns `{ ok: true }` |
| `/metrics` | GET | Prometheus metrics output |
| `/dashboard` | GET | Live database dashboard (HTML) |
| `/github/webhook` | POST | GitHub webhook receiver (signature verified) |
| `/slack/events` | POST | Slack events stub (v2.0) |

---

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build the image directly
docker build -t chatops-bot .
docker run -p 3000:3000 --env-file config/local.env chatops-bot
```

The Docker setup includes:
- **Non-root user** (`nodejs:1001`) for security
- **Health check** endpoint monitoring
- **JSON file logging** with log rotation
- **Node.js 18 Alpine** base image for minimal size

---

## 📈 Monitoring & Observability

### Prometheus Metrics (`GET /metrics`)

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `chatops_deployments_total` | Counter | service, env, status | Total deployments triggered |
| `chatops_deployment_duration_seconds` | Histogram | service, env | Deployment workflow duration |
| `chatops_active_deployments` | Gauge | env | Currently running deployments |

### Winston Logging

- **Development**: Colorized console output with timestamps
- **Production**: JSON format suitable for Splunk/ELK/CloudWatch
- **Log Files**: `logs/error.log` (errors), `logs/combined.log` (all levels)

### Live Dashboard

Visit `http://localhost:3000/dashboard` for a real-time view of:
- Deployment statistics and success rates
- Full command history with metadata
- RBAC role assignments
- Registered services

---

## 🧪 Testing

```bash
# Run tests with coverage
npm test

# Run tests in watch mode
npx jest --watch
```

### Test Configuration

- **Framework**: Jest with ESM support
- **Coverage Target**: 50% (branches, functions, lines)
- **CI**: GitHub Actions runs `jest --coverage` on every push/PR

---

## 🔒 Security

| Feature | Implementation |
|---------|---------------|
| **Secrets** | Stored in `config/local.env` (gitignored) — never committed |
| **Webhook Verification** | GitHub webhook signatures verified with HMAC SHA-256 |
| **HTTP Security** | Helmet.js for security headers |
| **Rate Limiting** | Express rate limiter (120 req/min) + per-command cooldowns |
| **RBAC** | Role-based access for all destructive operations |
| **Docker** | Non-root user, minimal Alpine image |
| **Env Validation** | Startup fails fast if required env vars are missing |

---

## ✅ Implementation Status

### v1.0 — Current Release ✅

- [x] 10 Discord slash commands with full RBAC
- [x] Production approval workflow with 30-minute expiry
- [x] GitHub Actions integration (trigger + poll + webhook)
- [x] MongoDB audit trail with correlation IDs
- [x] Prometheus metrics endpoint
- [x] Live database dashboard
- [x] Winston structured logging (wired into all files)
- [x] Rate limiting and cooldown system
- [x] Retry with exponential backoff
- [x] Rollback to last successful deployment
- [x] Multi-service registration
- [x] Docker containerization
- [x] CI pipeline with real Jest tests
- [x] GitHub webhook signature verification

### Bug Fixes Applied (from Analysis Report)

- [x] **FIX-001**: Smart quote syntax error in deploy.js (CRITICAL)
- [x] **FIX-002**: Undefined variable `service` → `serviceName` (CRITICAL)
- [x] **FIX-003**: Missing `slack.js` route file (HIGH)
- [x] **FIX-004**: GitHub webhook signature verification (HIGH)
- [x] **FIX-005**: Winston logger wired into all files (MEDIUM)
- [x] **FIX-006**: Prometheus `/metrics` endpoint exposed (MEDIUM)
- [x] **FIX-007**: `/audit` command Discord options added (MEDIUM)
- [x] **FIX-008**: Approval timeout (30 min auto-expiry) (MEDIUM)
- [x] **FIX-009**: Duplicate `getUserRole()` consolidated (MEDIUM)
- [x] **FIX-010**: `ping.js` rewritten cleanly (MEDIUM)
- [x] **FIX-011**: Dead models deleted (Deployment.js, Rbac.js) (LOW)
- [x] **FIX-012**: Unused `@octokit/rest` removed (LOW)
- [x] **FIX-013**: Duplicate if-check in addservice.js (LOW)
- [x] **FIX-014**: CI runs real tests with coverage threshold (LOW)
- [x] **FIX-015**: Failing rollback test string mismatch fixed (LOW)
- [x] **FIX-016**: Live database dashboard added (NEW)
- [x] **FIX-017**: CommandAudit meta field for context (NEW)
- [x] **FIX-018**: All commands log with metadata context (NEW)

---

## 🗺️ Roadmap (v2.0)

| Feature | Priority | Status |
|---------|----------|--------|
| Slack adapter (multi-platform support) | P0 | 🔜 Planned |
| HashiCorp Vault / AWS SSM secrets | P0 | 🔜 Planned |
| Canary deployments (`/canary`, `/promote`) | P0 | 🔜 Planned |
| N-of-M multi-party approval workflows | P1 | 🔜 Planned |
| Multi-repo scoped RBAC | P1 | 🔜 Planned |
| Deployment lifecycle DM notifications | P1 | 🔜 Planned |
| REST API layer with JWT auth | P2 | 🔜 Planned |
| Grafana dashboard JSON | P2 | 🔜 Planned |
| E2E tests with Playwright | P2 | 🔜 Planned |
| Test coverage ≥ 85% | P1 | 🔜 Planned |

---

## 📄 License

MIT © 2025 Rituraj Tripathi

---

<p align="center">
  Built with ❤️ using Node.js, Discord.js, MongoDB, and GitHub Actions
</p>
]]>
