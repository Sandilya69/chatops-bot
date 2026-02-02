import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Service from './src/models/Service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, 'config', 'local.env') });

async function register() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const serviceData = {
      name: 'practice-3',
      repo: 'Sandilya69/my-project-practice_3',
      workflow_id: 'deploy.yml', // assuming default
      envs: ['dev', 'staging', 'prod'],
      allowed_branches: ['main']
    };

    const existing = await Service.findOne({ name: serviceData.name });
    if (existing) {
      await Service.updateOne({ name: serviceData.name }, { $set: serviceData });
      console.log('Service updated!');
    } else {
      await Service.create(serviceData);
      console.log('Service registered!');
    }

    process.exit(0);
  } catch (err) {
    console.error('Registration failed:', err);
    process.exit(1);
  }
}

register();
