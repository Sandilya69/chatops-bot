## Data Models (Phase 1)

### services
```
{
  name: string,
  repo: string,             // owner/repo
  workflow_id: string|number,
  envs: string[],
  allowed_branches: string[]
}
```

### rbac
```
{
  slack_user: string,       // Slack user ID
  role: 'developer' | 'approver' | 'admin',
  allowed_envs: string[],
  permissions: string[]     // e.g., ['deploy', 'rollback', 'approve']
}
```

### deployments
```
{
  correlation_id: string,   // uuid
  user: string,             // Slack user ID
  service: string,
  env: string,
  version: string,          // tag/sha
  status: 'queued' | 'in_progress' | 'success' | 'failed' | 'cancelled',
  timestamps: {
    created_at: Date,
    started_at?: Date,
    completed_at?: Date
  },
  message_ts?: string,      // Slack thread timestamp
  channel_id?: string,
  run_id?: number,          // GitHub Actions run id
  logs_url?: string
}
```

### audit_logs
```
{
  action: string,           // 'deploy_command' | 'approve' | 'rollback' | ...
  user: string,             // Slack user ID
  timestamp: Date,
  details: object
}
```

### channel_config
```
{
  channel_id: string,
  service_mapping: {
    [service: string]: string // optional per-channel default env or notes
  }
}
```


