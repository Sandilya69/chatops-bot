import mongoose from 'mongoose';

const commandAuditSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  command: { type: String, required: true },
  timestamp: { type: Date, default: () => new Date() },
  status: { type: String, enum: ['success', 'denied', 'error'], required: true }
}, { collection: 'audit_logs' });

export default mongoose.model('CommandAudit', commandAuditSchema);


