const UserInvestment = require('../models/UserInvestment');
const { applyTransaction } = require('./wallet.service');
const { notifyUser } = require('./notification.service');
const { formatCurrency } = require('../utils/format');

const MIN_CREDIT = 0.01;
const round = (n) => Number(Number(n || 0).toFixed(2));

/**
 * Straight-line accrual between the allocation date and the maturity date.
 * Returns the total return an investor should have earned by `asOf`.
 */
function accruedReturn(position, asOf = new Date()) {
  const start = new Date(position.createdAt).getTime();
  const end = position.maturityDate ? new Date(position.maturityDate).getTime() : null;
  const expected = Number(position.expectedReturn || 0);
  if (!end || end <= start || expected <= 0) return 0;
  const progress = Math.min(1, Math.max(0, (asOf.getTime() - start) / (end - start)));
  return round(expected * progress);
}

/**
 * Credits accrued returns for every active position and closes matured ones by
 * returning the principal to the wallet. Idempotent: each run only pays the
 * delta between what has already been credited (`earnedReturn`) and what the
 * schedule says is due, so running it twice in a day is harmless.
 */
async function runPayouts({ asOf = new Date(), dryRun = false } = {}) {
  const positions = await UserInvestment.find({ status: 'active' })
    .populate('investment', 'title')
    .lean();

  const summary = { scanned: positions.length, accrued: 0, accruedValue: 0, matured: 0, principalReturned: 0 };
  const entries = [];

  for (const position of positions) {
    const due = accruedReturn(position, asOf);
    const delta = round(due - Number(position.earnedReturn || 0));
    const isMature = position.maturityDate ? new Date(position.maturityDate) <= asOf : false;
    const title = position.investment?.title || 'your investment';

    if (delta >= MIN_CREDIT) {
      summary.accrued += 1;
      summary.accruedValue = round(summary.accruedValue + delta);
      entries.push({ position: String(position._id), title, type: 'return', amount: delta });

      if (!dryRun) {
        await applyTransaction(position.user, {
          type: 'return',
          amount: delta,
          investment: position.investment?._id || position.investment,
          description: `Return payout — ${title}`,
        });
        await UserInvestment.updateOne({ _id: position._id }, { $set: { earnedReturn: due } });
        await notifyUser(position.user, {
          title: 'Return credited',
          message: `${formatCurrency(delta)} from ${title} has been credited to your wallet.`,
          type: 'success',
          link: '/wallet',
        });
      }
    }

    if (isMature) {
      const principal = round(position.amount);
      summary.matured += 1;
      summary.principalReturned = round(summary.principalReturned + principal);
      entries.push({ position: String(position._id), title, type: 'principal', amount: principal });

      if (!dryRun) {
        await applyTransaction(position.user, {
          type: 'return',
          amount: principal,
          investment: position.investment?._id || position.investment,
          description: `Principal returned — ${title}`,
        });
        await UserInvestment.updateOne(
          { _id: position._id },
          { $set: { status: 'completed', earnedReturn: round(position.expectedReturn) } }
        );
        await notifyUser(position.user, {
          title: 'Investment matured',
          message: `${title} reached maturity. ${formatCurrency(principal)} principal is back in your wallet.`,
          type: 'success',
          link: '/portfolio',
        });
      }
    }
  }

  return { ...summary, dryRun, asOf: asOf.toISOString(), entries: entries.slice(0, 50) };
}

module.exports = { runPayouts, accruedReturn };
