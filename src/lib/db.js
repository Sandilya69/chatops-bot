import mongoose from 'mongoose';

export async function connectToDatabase(uri) {
  if (!uri) throw new Error('MONGODB_URI missing');

  mongoose.connection.on('connected', () => console.log('✅ MongoDB connected'));
  mongoose.connection.on('error', (err) => console.error('❌ MongoDB error:', err));
  mongoose.connection.on('disconnected', () => console.warn('⚠️ MongoDB disconnected. Retrying...'));

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    autoIndex: true
  });
  return mongoose;
}


