import { Client, GatewayIntentBits, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection } from 'discord.js';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { validateEnv } from '../config/validate.js';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), 'config', 'local.env') });
validateEnv();

import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { isApprover } from './lib/rbac.js';
import { getUserRole, isAuthorizedForDeploy } from './lib/roles.js';
import { handleDeploy } from './commands/deploy.js';
import { logAudit } from './lib/audit.js';
import { activeDeployments, cooldownUntil, isInCooldown, setCooldown, pendingApprovals, keyFor } from './lib/state.js';
import { v4 as uuidv4 } from 'uuid';
import ActiveDeploy from './models/ActiveDeploy.js';
import logger from './lib/logger.js';

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
    logger.info(`🧩 Loaded commands: ${[...client.commands.keys()].join(', ')}`);
  }
} catch (e) {
  logger.error('Command load error', { error: e.message });
}

client.once(Events.ClientReady, c => {
  logger.info(`🤖 Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    logger.error('Interaction error', { error: err.message, command: interaction.commandName });
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
    } else if (action === 'confirm_rollback') {
      // ID format -- confirm_rollback:service:sha
      const parts = interaction.customId.split(':');
      if (parts.length < 3) return;
      
      const service = parts[1];
      const sha = parts[2];
      
      await interaction.update({ content: `🚨 **Rollback Confirmed** to ${sha.substring(0,7)}. Deployment starting...`, components: [] });
      
      const { handleDeploy } = await import('./commands/deploy.js');
      // Create wrapped interaction to reuse deploy logic
      const wrapped = {
        ...interaction,
        user: interaction.user,
        options: {
          getString: (name) => {
            if (name === 'service') return service;
            if (name === 'env') return 'prod'; // Rollbacks target prod by default
            if (name === 'version') return sha;
            if (name === 'correlation') return `rollback-${uuidv4()}`;
            return null;
          }
        },
        reply: (payload) => interaction.followUp(payload),
        editReply: (payload) => interaction.editReply(payload),
        fetchReply: () => interaction.fetchReply(),
        followUp: (payload) => interaction.followUp(payload)
      };
      
      await handleDeploy(wrapped);
    } else if (action === 'cancel_rollback') {
      await interaction.update({ content: 'Rollback cancelled.', components: [] });
    }
  } catch (err) {
    logger.error('Approval interaction error', { error: err.message });
  }
});

import express from 'express';
import bodyParser from 'body-parser';
import githubRoutes from './routes/github.js';

const app = express();
app.use(bodyParser.json());

// Mount the GitHub webhook router (Step 5)
app.use('/github', (req, res, next) => {
    req.discordClient = client;
    next();
}, githubRoutes);

async function startBot() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      logger.info('✅ Connected to MongoDB');
      // Resume any in-flight deployments
      const inflight = await ActiveDeploy.find({ status: 'in_progress' }).lean();
      if (inflight.length) {
        logger.info(`↩️ Resuming ${inflight.length} in-flight deployment(s)...`);
      }
    } catch (err) {
      logger.error('❌ MongoDB connection failed', { error: err.message });
    }
  } else {
    logger.warn('⚠️ MONGO_URI/MONGODB_URI not set; skipping DB connection');
  }

  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    logger.error('Missing DISCORD_TOKEN in environment');
    process.exit(1);
  }
  
  // Start Express server (Step 5)
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    logger.info(`📡 Webhook server listening on port ${port}`);
  });

  client.login(token);
}

startBot();


