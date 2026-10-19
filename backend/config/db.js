const mongoose = require('mongoose');
const { env } = require('./env');

mongoose.set('strictQuery', true);

async function connectDB() {
  const conn = await mongoose.connect(env.mongoUri, {
    autoIndex: env.nodeEnv !== 'production',
    serverSelectionTimeoutMS: 10000,
  });
  return conn.connection;
}

module.exports = { connectDB };
