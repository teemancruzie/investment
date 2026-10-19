/* Seeds an admin account, categories, sample investments and site content. */
const mongoose = require('mongoose');
const { env, assertEnv } = require('../config/env');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Investment = require('../models/Investment');
const Testimonial = require('../models/Testimonial');
const Faq = require('../models/Faq');
const TeamMember = require('../models/TeamMember');

const CATEGORIES = [
  { name: 'Real Estate', description: 'Income-producing property portfolios', order: 1 },
  { name: 'Private Credit', description: 'Senior secured lending to vetted businesses', order: 2 },
  { name: 'Renewable Energy', description: 'Solar, wind and storage infrastructure', order: 3 },
  { name: 'Venture Growth', description: 'Late-stage technology companies', order: 4 },
];

async function run() {
  assertEnv();
  await connectDB();

  const admin = await User.findOne({ email: 'admin@investment.local' });
  if (!admin) {
    await User.create({
      firstName: 'Platform',
      lastName: 'Admin',
      email: 'admin@investment.local',
      password: 'Admin1234',
      role: 'admin',
      isEmailVerified: true,
    });
    console.info('Created admin admin@investment.local / Admin1234 — change this password immediately.');
  }

  // Demo investor with a funded wallet for trying every feature.
  let demo = await User.findOne({ email: 'demo@meridian.local' });
  if (!demo) {
    demo = await User.create({
      firstName: 'Demo',
      lastName: 'Investor',
      email: 'demo@meridian.local',
      password: 'Demo12345',
      role: 'user',
      isEmailVerified: true,
      country: 'Nigeria',
    });
    const { applyTransaction } = require('../services/wallet.service');
    await applyTransaction(demo._id, {
      type: 'deposit',
      amount: 25000,
      description: 'Demo starting balance',
    });
    console.info('Created demo investor demo@meridian.local / Demo12345 with $25,000 balance.');
  }

  const categories = [];
  for (const c of CATEGORIES) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await Category.findOne({ name: c.name });
    // eslint-disable-next-line no-await-in-loop
    categories.push(existing || (await Category.create(c)));
  }

  if ((await Investment.countDocuments()) === 0) {
    await Investment.create([
      {
        title: 'Harbour District Residences',
        summary: 'Core-plus residential block in a supply-constrained waterfront district.',
        description: 'A 42-unit residential asset with stabilised occupancy and index-linked leases.',
        category: categories[0]._id,
        expectedAnnualReturn: 11.4,
        durationMonths: 48,
        minimumInvestment: 2500,
        fundingGoal: 4200000,
        fundedAmount: 2860000,
        totalUnits: 1680,
        unitsSold: 1144,
        riskLevel: 'low',
        status: 'active',
        isFeatured: true,
        location: 'Rotterdam, NL',
      },
      {
        title: 'Meridian Senior Credit Fund II',
        summary: 'Senior secured loans to profitable mid-market operators.',
        description: 'Diversified pool of first-lien loans with quarterly cash distributions.',
        category: categories[1]._id,
        expectedAnnualReturn: 9.2,
        durationMonths: 36,
        minimumInvestment: 5000,
        fundingGoal: 8000000,
        fundedAmount: 6120000,
        totalUnits: 1600,
        unitsSold: 1224,
        riskLevel: 'medium',
        status: 'active',
        location: 'London, UK',
      },
      {
        title: 'Solaris Grid Storage',
        summary: 'Utility-scale battery storage with contracted offtake.',
        description: '120 MWh storage facility with a 15-year contracted revenue floor.',
        category: categories[2]._id,
        expectedAnnualReturn: 14.6,
        durationMonths: 60,
        minimumInvestment: 1000,
        fundingGoal: 3000000,
        fundedAmount: 940000,
        totalUnits: 3000,
        unitsSold: 940,
        riskLevel: 'high',
        status: 'active',
        isFeatured: true,
        location: 'Seville, ES',
      },
    ]);
  }

  if ((await Testimonial.countDocuments()) === 0) {
    await Testimonial.create([
      { name: 'Amara Osei', role: 'Private investor', quote: 'The reporting is the clearest I have seen from any platform.', order: 1 },
      { name: 'Daniel Reyes', role: 'Family office analyst', quote: 'Diligence packs are institutional grade and genuinely readable.', order: 2 },
      { name: 'Helena Brandt', role: 'Founder', quote: 'Allocating across four asset classes now takes minutes, not weeks.', order: 3 },
    ]);
  }

  if ((await Faq.countDocuments()) === 0) {
    await Faq.create([
      { question: 'What is the minimum investment?', answer: 'Minimums are set per opportunity and start at 1,000.', order: 1 },
      { question: 'How are returns paid?', answer: 'Distributions are credited to your platform wallet on each schedule date.', order: 2 },
      { question: 'Can I withdraw early?', answer: 'Positions are held to maturity; wallet balances can be withdrawn anytime.', order: 3 },
      { question: 'Is my money protected?', answer: 'Assets are held by regulated custodians and segregated from platform funds.', order: 4 },
    ]);
  }

  if ((await TeamMember.countDocuments()) === 0) {
    await TeamMember.create([
      { name: 'Lena Kovač', title: 'Chief Investment Officer', order: 1 },
      { name: 'Marcus Bell', title: 'Head of Credit', order: 2 },
      { name: 'Priya Nair', title: 'Head of Risk', order: 3 },
    ]);
  }

  console.info(`Seed complete on ${env.nodeEnv}`);
  await mongoose.connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
