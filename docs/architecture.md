## ChatOps Deployment Bot — Architecture (Phase 1)

### Core Objectives
- Orchestrate GitHub Actions deployments end-to-end from Slack.
- Secure Slack slash commands and interactive workflows.
- Persist configurations, RBAC, deployments, and audits in MongoDB.
- Stream live GitHub Action updates to Slack threads.

### High-Level Components
- Slack App Backend (Express): handles slash commands, interactions, webhooks
- MongoDB: services, rbac, deployments, audit_logs, channel_config
- GitHub Integration: trigger workflows, poll status, receive webhooks
- Slack Client Layer: message/modals updates via Web API

### Key Flows
1) User triggers `/deploy` or `/rollback` in Slack.
2) Backend verifies Slack signature, checks RBAC in MongoDB.
3) Backend triggers GitHub Actions workflow (dispatch) with correlation id.
4) GitHub sends workflow_run/workflow_job webhooks.
5) Backend updates Slack thread with live status; persists events/audits.

### Security & Compliance
- Verify Slack signatures and timestamps.
- Use GitHub PAT/App with least-privilege scopes.
- Enforce RBAC for environments and actions; require approvals for prod.
- Full audit trail of commands, outcomes, and actor identity.

### Reliability & Resilience
- Idempotent command handling using correlation ids.
- Cooldowns and concurrency guards for service/env.
- Retry policies for Slack/GitHub API rate limits or transient failures.
- Resume in-flight deployment tracking on restart.

### Observability
- Prometheus `/metrics` endpoint in the bot.
- Deployment lifecycle metrics: lead time, success rate, MTTR.

### Data Model Overview
- services: { name, repo, workflow_id, envs, allowed_branches }
- rbac: { slack_user, role, allowed_envs, permissions }
- deployments: { correlation_id, user, service, env, version, status, timestamps }
- audit_logs: { action, user, timestamp, details }
- channel_config: { channel_id, service_mapping }


