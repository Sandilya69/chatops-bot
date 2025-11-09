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


