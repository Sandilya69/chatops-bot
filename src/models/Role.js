import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // Discord user ID
  role: { type: String, enum: ['admin', 'developer', 'tester', 'viewer'], required: true }
}, { timestamps: true });

export default mongoose.model('Role', roleSchema);


