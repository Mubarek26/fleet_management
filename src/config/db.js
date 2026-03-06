
// db.js
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });


const connectDB = async () => {
  const envName = (process.env.NODE_ENV || 'development').trim().toLowerCase();
  const uriKeyByEnv = {
    development: 'DATABASE_DEV',
    dev: 'DATABASE_DEV',
    production: 'DATABASE_PROD',
    prod: 'DATABASE_PROD',
    local: 'DATABASE_LOCAL',
  };
  const selectedUriKey = uriKeyByEnv[envName] || 'DATABASE_DEV';
  const uriByEnv = {
    development: process.env.DATABASE_DEV,
    dev: process.env.DATABASE_DEV,
    production: process.env.DATABASE_PROD,
    prod: process.env.DATABASE_PROD,
    local: process.env.DATABASE_LOCAL,
  };

  const uri = uriByEnv[envName] || process.env.DATABASE_DEV;

  if (!uri) {
    console.error(`❌ No database URI configured for ENV_NAME='${envName}'. Available ENV_NAME values: development/dev, production/prod, local.`);
    console.error('ENV_NAME:', envName);
    console.error('DATABASE_DEV set?', Boolean(process.env.DATABASE_DEV));
    console.error('DATABASE_PROD set?', Boolean(process.env.DATABASE_PROD));
    console.error('DATABASE_LOCAL set?', Boolean(process.env.DATABASE_LOCAL));
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);

    if (typeof ensureSuperAdmin === 'function') {
      await ensureSuperAdmin();
    }

    console.log(`✅ MongoDB connected for env '${envName}'.`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);

    if ((err.message || '').toLowerCase().includes('bad auth')) {
      console.error(`➡️ Authentication failed for ${selectedUriKey}.`);
      console.error('➡️ Check username/password in .env and URL-encode special chars in password.');
      console.error('➡️ Example: p@ss:word -> p%40ss%3Aword');
    }

    process.exit(1); // Stop the app if the DB connection fails
  }
};

module.exports = connectDB;
