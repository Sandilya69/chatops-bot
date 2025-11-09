import { Client, GatewayIntentBits, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection } from 'discord.js';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { isApprover } from './lib/rbac.js';
import { getUserRole, isAuthorizedForDeploy } from './lib/roles.js';
import { handleDeploy } from './commands/deploy.js';
import { logAudit } from './lib/audit.js';
import { activeDeployments, cooldownUntil, isInCooldown, setCooldown, pendingApprovals, keyFor } from './lib/state.js';
import { v4 as uuidv4 } from 'uuid';
import ActiveDeploy from './models/ActiveDeploy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../config/local.env') });

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Load command modules dynamically
try {
  const commandsPath = path.join(__dirname, 'commands');
  if (fs.existsSync(commandsPath)) {
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const { default: command } = await import(`./commands/${file}`);
      if (command?.data?.name) {
        client.commands.set(command.data.name, command);
      }
    }
    // eslint-disable-next-line no-console
    console.log(`🧩 Loaded commands: ${[...client.commands.keys()].join(', ')}`);
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.error('Command load error:', e);
}

client.once(Events.ClientReady, c => {
  // eslint-disable-next-line no-console
  console.log(`🤖 Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Interaction error:', err);
    if (!interaction.replied) {
      await interaction.reply({ content: '⚠️ Error handling command.', ephemeral: true });
    }
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;
  try {
    const [action, correlationId] = interaction.customId.split(':');
    const data = pendingApprovals.get(correlationId);
    if (!data) {
      return interaction.reply({ content: '⚠️ Approval request not found or expired.', ephemeral: true });
    }
    const approver = interaction.user.id;
    if (!(await isApprover(approver))) {
      return interaction.reply({ content: '🚫 Only approvers can take this action.', ephemeral: true });
    }

    if (action === 'approve') {
      pendingApprovals.delete(correlationId);
      const key = keyFor(data.service, data.env);
      if (activeDeployments.has(key)) {
        return interaction.reply({ content: `⏳ Already deploying ${data.service}/${data.env}.`, ephemeral: true });
      }
      activeDeployments.add(key);
      setTimeout(() => activeDeployments.delete(key), 5 * 60 * 1000);
      setCooldown(data.service, data.env, 60 * 1000);
      await logAudit('deploy_approved', approver, { correlationId, ...data });
      await interaction.update({ content: `✅ Approved by <@${approver}>. Deploying ${data.service} to ${data.env} (version: ${data.version}).`, components: [] });
      // Kick off deployment progress with threaded logs
      const msg = await interaction.fetchReply();
      // Simulate progress by calling the same flow as non-prod (also triggers GitHub)
      const { handleDeploy } = await import('./commands/deploy.js');
      // Create a faux interaction-like object to reuse flow
      const fakeOptions = new Map([
        ['service', { getString: () => data.service }],
        ['env', { getString: () => data.env }],
        ['version', { getString: () => data.version }]
      ]);
      const wrapped = {
        ...interaction,
        options: {
          getString: (name) => (name === 'service' ? data.service : name === 'env' ? data.env : data.version)
        },
        reply: (payload) => interaction.followUp(payload),
        editReply: (payload) => interaction.editReply(payload)
      };
      await handleDeploy(wrapped);
    } else if (action === 'reject') {
      pendingApprovals.delete(correlationId);
      await logAudit('deploy_rejected', approver, { correlationId, ...data });
      await interaction.update({ content: `❌ Rejected by <@${approver}>. Deployment canceled.`, components: [] });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Approval interaction error:', err);
  }
});

async function startBot() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      // eslint-disable-next-line no-console
      console.log('✅ Connected to MongoDB');
      // Resume any in-flight deployments
      const inflight = await ActiveDeploy.find({ status: 'in_progress' }).lean();
      if (inflight.length) {
        // eslint-disable-next-line no-console
        console.log(`↩️ Resuming ${inflight.length} in-flight deployment(s)...`);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ MongoDB connection failed:', err.message);
    }
  } else {
    // eslint-disable-next-line no-console
    console.warn('⚠️ MONGO_URI/MONGODB_URI not set; skipping DB connection');
  }

  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    // eslint-disable-next-line no-console
    console.error('Missing DISCORD_TOKEN in environment');
    process.exit(1);
  }
  client.login(token);
}

startBot();


