import mongoose from 'mongoose';

const channelConfigSchema = new mongoose.Schema({
  channel_id: { type: String, required: true, unique: true },
  service_mapping: { type: Object, default: {} }
});

export default mongoose.model('ChannelConfig', channelConfigSchema);


