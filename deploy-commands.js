import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, 'config', 'local.env') });

const commands = [
  { name: 'ping', description: 'Replies with Pong!' },
  { name: 'status', description: 'Check GitHub Actions workflow status', options: [
    { name: 'correlation', description: 'Correlation ID', type: 3, required: false },
    { name: 'run_id', description: 'Workflow run id', type: 4, required: false }
  ]},
  { name: 'metrics', description: 'Show ChatOps command and deployment metrics' },
  {
    name: 'addrole',
    description: 'Add a new user role (Admin only)',
    options: [
      { name: 'user_id', description: 'Discord user ID', type: 3, required: true },
      {
        name: 'role', description: 'Role to assign', type: 3, required: true,
        choices: [
          { name: 'admin', value: 'admin' },
          { name: 'developer', value: 'developer' },
          { name: 'tester', value: 'tester' },
          { name: 'viewer', value: 'viewer' }
        ]
      }
    ]
  },
  {
    name: 'deleterole',
    description: 'Remove a user role (Admin only)',
    options: [
      { name: 'user_id', description: 'Discord user ID', type: 3, required: true }
    ]
  },
  {
    name: 'viewroles',
    description: 'List all user roles'
  },
  {
    name: 'audit',
    description: 'View deployment audit trail',
    options: [
      { name: 'service', description: 'Filter by service name', type: 3, required: false },
      { name: 'correlation', description: 'Look up specific correlation ID', type: 3, required: false },
      { name: 'limit', description: 'Number of records (default 5, max 20)', type: 4, required: false }
    ]
  },
  {
    name: 'addservice',
    description: 'Register a new service (Admin only)',
    options: [
      { name: 'name', description: 'Service name (e.g. api)', type: 3, required: true },
      { name: 'owner', description: 'GitHub Owner/Org', type: 3, required: true },
      { name: 'repo', description: 'GitHub Repository', type: 3, required: true },
      { name: 'workflow', description: 'Workflow filename (default: deploy.yml)', type: 3, required: false }
    ]
  },
  {
    name: 'deploy',
    description: 'Deploys a service',
    options: [
      { name: 'service', description: 'Service name', type: 3, required: true },
      {
        name: 'env', description: 'Environment', type: 3, required: true,
        choices: [
          { name: 'dev', value: 'dev' },
          { name: 'staging', value: 'staging' },
          { name: 'prod', value: 'prod' }
        ]
      },
      { name: 'version', description: 'Tag or commit', type: 3, required: false },
      { name: 'correlation', description: 'Idempotency correlation id', type: 3, required: false }
    ]
  },
  {
    name: 'rollback',
    description: 'Revert a service to the last known good version (Step 8)',
    options: [
      { name: 'service', description: 'Service name to rollback', type: 3, required: true }
    ]
  }
];

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  // eslint-disable-next-line no-console
  console.error('Missing DISCORD_TOKEN or CLIENT_ID in environment');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

async function main() {
  try {
    // eslint-disable-next-line no-console
    console.log('Registering slash commands...');
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    // eslint-disable-next-line no-console
    console.log('✅ Commands registered!');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to register commands:', error);
    process.exit(1);
  }
}

main();


