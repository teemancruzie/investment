const app = require('./app');
const { env, assertEnv } = require('./config/env');
const { connectDB } = require('./config/db');
const { startPayoutJob } = require('./jobs/payoutScheduler');

async function start() {
  assertEnv();
  await connectDB();
  console.info('MongoDB connected');

  const server = app.listen(env.port, () => {
    console.info(`API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  startPayoutJob();

  const shutdown = (signal) => () => {
    console.info(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown('SIGINT'));
  process.on('SIGTERM', shutdown('SIGTERM'));
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
    server.close(() => process.exit(1));
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
