import mongoose from 'mongoose';

export function isDbConnected() {
  // 1 = connected
  return mongoose.connection?.readyState === 1;
}


