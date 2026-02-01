import mongoose from 'mongoose';

const activeDeploySchema = new mongoose.Schema({
  correlationId: { type: String, required: true, unique: true },
  service: { type: String, required: true },
  env: { type: String, required: true },
  version: { type: String, required: true },
  userId: { type: String, required: true },
  startedAt: { type: Date, default: () => new Date() },
  status: { type: String, enum: ['in_progress', 'completed', 'failed'], default: 'in_progress' },
  workflowRunId: { type: Number },
  threadId: { type: String },
  channelId: { type: String }
});

export default mongoose.model('ActiveDeploy', activeDeploySchema);


