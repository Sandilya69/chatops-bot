import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  user: { type: String, required: true },
  timestamp: { type: Date, default: () => new Date() },
  details: { type: Object, default: {} }
});

export default mongoose.model('AuditLog', auditLogSchema);


