const { body, param } = require('express-validator');

const idRule = [param('id').isMongoId().withMessage('Invalid id')];

// Built by a factory so create (required) and update (all optional) rule sets
// are independent chains — express-validator chains are mutable objects.
const buildInvestmentRules = ({ optional }) => {
  const field = (name) => (optional ? body(name).optional() : body(name));
  return [
    field('title').trim().notEmpty().isLength({ max: 140 }),
    field('description').trim().notEmpty(),
    body('summary').optional().isLength({ max: 280 }),
    field('category').isMongoId().withMessage('A valid category is required'),
    field('expectedAnnualReturn').isFloat({ min: 0, max: 200 }),
    field('durationMonths').isInt({ min: 1 }),
    field('minimumInvestment').isFloat({ min: 0 }),
    field('fundingGoal').isFloat({ min: 1 }),
    field('totalUnits').isInt({ min: 1 }),
    body('riskLevel').optional().isIn(['low', 'medium', 'high']),
    body('status').optional().isIn(['draft', 'active', 'funded', 'closed', 'archived']),
  ];
};

const investmentRules = buildInvestmentRules({ optional: false });
const investmentUpdateRules = buildInvestmentRules({ optional: true });


const investRules = [...idRule, body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than zero')];

const categoryRules = [
  body('name').trim().notEmpty().isLength({ max: 80 }),
  body('description').optional().isLength({ max: 500 }),
  body('isActive').optional().isBoolean(),
];

const amountRules = [body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than zero')];

const profileRules = [
  body('firstName').optional().trim().notEmpty().isLength({ max: 60 }),
  body('lastName').optional().trim().notEmpty().isLength({ max: 60 }),
  body('phone').optional().trim().isLength({ max: 30 }),
  body('country').optional().trim().isLength({ max: 60 }),
];

const statusRules = [...idRule, body('status').isIn(['active', 'disabled'])];
const roleRules = [...idRule, body('role').isIn(['user', 'admin'])];

const broadcastRules = [
  body('title').trim().notEmpty().isLength({ max: 140 }),
  body('message').trim().notEmpty().isLength({ max: 1000 }),
  body('type').optional().isIn(['info', 'success', 'warning', 'security']),
  body('sendEmail').optional().isBoolean(),
];

const { SYMBOLS } = require('../config/cryptoAssets');

const cryptoDepositRules = [
  body('asset').customSanitizer((v) => String(v || '').toUpperCase()).isIn(SYMBOLS).withMessage('Unsupported asset'),
  body('network').trim().notEmpty().withMessage('Select a network'),
  body('cryptoAmount').isFloat({ gt: 0 }).withMessage('Enter the amount you sent'),
  body('txHash').trim().isLength({ min: 8, max: 200 }).withMessage('Enter the transaction hash'),
  body('proofUrl').optional().isLength({ max: 400 }),
];

const cryptoWithdrawRules = [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than zero'),
  body('asset').customSanitizer((v) => String(v || '').toUpperCase()).isIn(SYMBOLS).withMessage('Unsupported asset'),
  body('network').trim().notEmpty().withMessage('Select a network'),
  body('address').trim().isLength({ min: 16, max: 200 }).withMessage('Enter a valid payout address'),
];

const reviewRules = [
  ...idRule,
  body('action').isIn(['approve', 'reject']),
  body('amount').optional().isFloat({ gt: 0 }),
  body('note').optional().isLength({ max: 500 }),
];

const withdrawalReviewRules = [
  ...idRule,
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('note')
    .if(body('action').equals('reject'))
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('A reviewer note is required when declining'),
  body('note').optional().isLength({ max: 500 }),
  body('payoutTxHash').optional().trim().isLength({ max: 200 }),
];

const walletAdjustRules = [
  ...idRule,
  body('action').isIn(['credit', 'debit']).withMessage('Action must be credit or debit'),
  body('amount').isFloat({ gt: 0 }).withMessage('Enter an amount greater than zero'),
  body('note').trim().isLength({ min: 3, max: 500 }).withMessage('Add a short reason (3–500 characters)'),
];

const walletHoldRules = [...idRule, body('frozen').isBoolean(), body('reason').optional().isLength({ max: 500 })];

const depositAddressRules = [
  body('asset').customSanitizer((v) => String(v || '').toUpperCase()).isIn(SYMBOLS),
  body('network').trim().notEmpty(),
  body('address').optional().trim().isLength({ max: 200 }),
  body('enabled').optional().isBoolean(),
];

module.exports = {
  walletAdjustRules,
  walletHoldRules,
  depositAddressRules,
  withdrawalReviewRules,
  idRule,
  investmentRules,
  investmentUpdateRules,
  investRules,
  categoryRules,
  amountRules,
  profileRules,
  statusRules,
  roleRules,
  broadcastRules,
  cryptoDepositRules,
  cryptoWithdrawRules,
  reviewRules,
};
