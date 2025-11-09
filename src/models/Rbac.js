import mongoose from 'mongoose';

const rbacSchema = new mongoose.Schema({
  slack_user: { type: String, required: true, unique: true },
  role: { type: String, enum: ['developer', 'approver', 'admin'], required: true },
  allowed_envs: { type: [String], default: [] },
  permissions: { type: [String], default: [] }
}, { timestamps: true });

export default mongoose.model('Rbac', rbacSchema);


