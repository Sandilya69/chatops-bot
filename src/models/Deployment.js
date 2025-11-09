import mongoose from 'mongoose';

const deploymentSchema = new mongoose.Schema({
  correlation_id: { type: String, required: true, unique: true },
  user: { type: String, required: true },
  service: { type: String, required: true },
  env: { type: String, required: true },
  version: { type: String, required: true },
  status: { type: String, enum: ['queued', 'in_progress', 'success', 'failed', 'cancelled'], default: 'queued' },
  timestamps: {
    created_at: { type: Date, default: () => new Date() },
    started_at: { type: Date },
    completed_at: { type: Date }
  },
  message_ts: { type: String },
  channel_id: { type: String },
  run_id: { type: Number },
  logs_url: { type: String }
}, { minimize: false });

export default mongoose.model('Deployment', deploymentSchema);


