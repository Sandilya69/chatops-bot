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
  // Commit metadata - answers "Who added?" and "What was added?"
  commitAuthor: { type: String },      // Who wrote the code
  commitMessage: { type: String },     // What was changed
  commitSha: { type: String },         // Exact version deployed
  commitUrl: { type: String }          // Link to the commit
});

export default mongoose.model('ActiveDeploy', activeDeploySchema);


