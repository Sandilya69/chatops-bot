import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: 'config/local.env' });

const ServiceSchema = new mongoose.Schema({ name: String, repo: String, workflow_id: String });
const Service = mongoose.model('Service', ServiceSchema);

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Fix the bad repo path
  const result = await Service.updateOne(
    { name: 'api' },
    { $set: { repo: 'Sandilya69/chatops-bot' } }
  );
  console.log('Update result:', JSON.stringify(result));
  
  const s = await Service.findOne({ name: 'api' }).lean();
  console.log('Fixed service:', s.name, '| Repo:', s.repo);
  
  process.exit(0);
}

fix();
