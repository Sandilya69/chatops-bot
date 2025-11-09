import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  repo: { type: String, required: true },
  workflow_id: { type: mongoose.Schema.Types.Mixed, required: true },
  envs: { type: [String], default: [] },
  allowed_branches: { type: [String], default: [] }
}, { timestamps: true });

export default mongoose.model('Service', serviceSchema);


