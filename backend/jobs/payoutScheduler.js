const { runPayouts } = require('../services/payout.service');

const HOUR = 60 * 60 * 1000;

/**
 * Lightweight in-process scheduler. Runs the accrual/maturity sweep shortly
 * after boot and then on a fixed interval (default: every 6 hours).
 * Set PAYOUT_JOB_ENABLED=false to disable, PAYOUT_JOB_INTERVAL_HOURS to tune.
 */
function startPayoutJob() {
  if (String(process.env.PAYOUT_JOB_ENABLED || 'true') === 'false') {
    console.info('Payout job disabled');
    return null;
  }

  const hours = Number(process.env.PAYOUT_JOB_INTERVAL_HOURS || 6);
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await runPayouts();
      if (result.accrued || result.matured) {
        console.info(
          `Payout sweep: ${result.accrued} accruals ($${result.accruedValue}), ${result.matured} matured`
        );
      }
    } catch (error) {
      console.error('Payout sweep failed:', error.message);
    } finally {
      running = false;
    }
  };

  const bootTimer = setTimeout(tick, 30 * 1000);
  const interval = setInterval(tick, Math.max(1, hours) * HOUR);
  interval.unref?.();
  bootTimer.unref?.();

  console.info(`Payout job scheduled every ${hours}h`);
  return { interval, bootTimer };
}

module.exports = { startPayoutJob };
