## System Flows (Phase 1)

### Deploy Flow
1. Slack `/deploy` → backend verifies signature.
2. Backend fetches service config and user role from MongoDB.
3. RBAC check passes → open modal to collect service/env/version.
4. On submit → create deployment record with correlation_id.
5. Trigger GitHub Actions workflow dispatch with inputs and correlation_id.
6. Post initial Slack message; store message_ts/thread info.
7. Receive GitHub webhooks → update deployment status, post thread updates.
8. On success/failure → finalize status, add audit log.

### Rollback Flow
1. Slack `/rollback` → signature verify, RBAC check.
2. Lookup last successful deployment for service/env in MongoDB.
3. Trigger rollback workflow with version/sha → post updates in Slack thread.

### Approval Flow (Production)
1. Prod deploy request → create pending approval record.
2. Notify approvers with interactive buttons.
3. On approval → proceed to trigger deploy workflow.
4. On reject/timeout → cancel request; log audit.

### Concurrency & Cooldown
- Before triggering, ensure no active deployment for same service/env.
- Enforce cooldown windows per service/env.

### Recovery on Restart
- On startup, query deployments with status in {queued, in_progress}.
- Resume tracking/polling; reconcile Slack thread states.


