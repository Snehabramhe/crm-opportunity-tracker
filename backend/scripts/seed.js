/**
 * Seed mock opportunities into the database.
 *
 * Usage:
 *   npm run seed           # adds 500 opportunities (default), appends
 *   npm run seed 100       # adds 100
 *   npm run seed 500 fresh # deletes ALL opportunities first, then adds 500
 *
 * This single script also ensures the demo owner users + the test login account
 * exist (all use foreign / Western names and the password "Password123").
 * Seeded opportunities are owned ONLY by these demo accounts, so no personal
 * names appear anywhere in the mock data.
 *
 *   Test login:  test@crm.test  /  Password123
 */
import mongoose from 'mongoose';
import env from '../src/config/env.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Opportunity, { STAGES, PRIORITIES } from '../src/models/Opportunity.js';

const COUNT = Number(process.argv[2]) || 500;
const FRESH = process.argv[3] === 'fresh';
const DEMO_PASSWORD = 'Password123';

// Demo accounts that own the seeded data. The test account is the one to log in with.
const DEMO_USERS = [
  { name: 'Test User', email: 'test@crm.test' },
  { name: 'Albert Johnson', email: 'albert@crm.test' },
  { name: 'John Smith', email: 'john@crm.test' },
  { name: 'Emma Williams', email: 'emma@crm.test' },
];

const COMPANIES = [
  'Acme Corp', 'Globex', 'Initech', 'Umbrella Inc', 'Stark Industries', 'Wayne Enterprises',
  'Wonka Industries', 'Soylent Corp', 'Cyberdyne Systems', 'Hooli', 'Pied Piper', 'Vehement Capital',
  'Massive Dynamic', 'Gekko & Co', 'Bluth Company', 'Vandelay Industries', 'Dunder Mifflin',
  'Prestige Worldwide', 'Wernham Hogg', 'Sterling Cooper', 'Oscorp', 'Tyrell Corp', 'Nakatomi Trading',
  'Aperture Science', 'Black Mesa', 'Weyland-Yutani', 'InGen', 'Abstergo', 'Rekall', 'Buy n Large',
];
const SUFFIX = ['Pvt Ltd', 'LLP', 'Technologies', 'Solutions', 'Systems', 'Labs', 'Ventures', 'Group', ''];
const FIRST = ['Albert', 'John', 'Emma', 'Oliver', 'Sophia', 'James', 'Charlotte', 'William', 'Amelia',
  'Henry', 'Isabella', 'George', 'Mia', 'Jack', 'Grace', 'Lucas', 'Lily', 'Daniel', 'Chloe', 'Ethan',
  'Hannah', 'Michael', 'Olivia', 'David', 'Emily', 'Benjamin', 'Ava', 'Samuel', 'Ella', 'Thomas'];
const LAST = ['Johnson', 'Smith', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson',
  'Taylor', 'Thomas', 'Moore', 'Martin', 'Clark', 'Walker', 'Hall', 'Young', 'King', 'Wright', 'Scott'];
const NEEDS = [
  'Needs a CRM integration', 'Looking for cloud migration', 'Wants an e-commerce platform',
  'Requires a mobile app', 'Interested in analytics dashboard', 'Needs payment gateway setup',
  'Exploring AI chatbot', 'Wants website redesign', 'Requires ERP implementation',
  'Looking for marketing automation', 'Needs data warehouse', 'Interested in cybersecurity audit',
  'Wants inventory management system', 'Requires API development', 'Looking for DevOps consulting',
  'Needs SEO optimization', 'Wants a custom dashboard', 'Requires database optimization',
];
const NOTES = [
  'Followed up over call, awaiting response.', 'Demo scheduled next week.', 'Sent proposal, negotiating price.',
  'Key decision maker is on leave.', 'Budget approved, finalizing scope.', 'Competitor also in talks.',
  'Very interested, fast-moving deal.', 'Needs internal approval first.', '', '',
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function randomDateWithinDays(days) {
  const offset = randInt(-10, days) * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + offset);
}

/** Ensure all demo/test users exist with a known password. Returns their ids. */
async function ensureDemoUsers() {
  const ids = [];
  for (const def of DEMO_USERS) {
    let user = await User.findOne({ email: def.email });
    if (!user) {
      // .create() triggers the bcrypt pre-save hook so the password is hashed.
      user = await User.create({ name: def.name, email: def.email, password: DEMO_PASSWORD });
      console.log(`Created user: ${def.email} (password: ${DEMO_PASSWORD})`);
    } else {
      // Keep name + password aligned with this script on every run.
      user.name = def.name;
      user.password = DEMO_PASSWORD;
      await user.save();
      console.log(`Updated user: ${def.email}`);
    }
    ids.push(user._id);
  }
  return ids;
}

function buildOpportunity(ownerId) {
  const company = `${rand(COMPANIES)}${Math.random() < 0.4 ? ' ' + rand(SUFFIX) : ''}`.trim();
  const contact = `${rand(FIRST)} ${rand(LAST)}`;
  return {
    owner: ownerId,
    customerName: company,
    contactName: contact,
    contactEmail: `${contact.split(' ')[0].toLowerCase()}@${company.split(' ')[0].toLowerCase()}.com`,
    contactPhone: `+1 ${randInt(200, 989)}-${randInt(200, 989)}-${randInt(1000, 9999)}`,
    requirement: rand(NEEDS),
    estimatedValue: randInt(5, 500) * 1000,
    stage: rand(STAGES),
    priority: rand(PRIORITIES),
    nextFollowUpDate: Math.random() < 0.85 ? randomDateWithinDays(45) : undefined,
    notes: rand(NOTES) || undefined,
  };
}

async function main() {
  console.log(`Connecting to ${env.mongoUri.replace(/\/\/.*@/, '//<creds>@')}`);
  await connectDB();

  const ownerIds = await ensureDemoUsers();
  console.log(`Using ${ownerIds.length} demo owners (incl. test@crm.test)`);

  if (FRESH) {
    const { deletedCount } = await Opportunity.deleteMany({});
    console.log(`FRESH: removed ${deletedCount} existing opportunities`);
  }

  const docs = Array.from({ length: COUNT }, () => buildOpportunity(rand(ownerIds)));
  const inserted = await Opportunity.insertMany(docs, { ordered: false });
  const total = await Opportunity.countDocuments();

  console.log(`✅ Inserted ${inserted.length} opportunities. Total in DB now: ${total}`);
  console.log('   Test login → test@crm.test / Password123');
  await disconnectDB();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
