const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../database/models/user.model');
const Driver = require('../database/models/driver.model');

async function syncDriverProfiles() {
  try {
    const dbUri = process.env.DATABASE_DEV || process.env.DATABASE_LOCAL;
    if (!dbUri) {
      throw new Error('DATABASE_DEV or DATABASE_LOCAL is not defined in .env file');
    }

    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB');

    const drivers = await User.find({ role: 'DRIVER' });
    console.log(`Found ${drivers.length} users with DRIVER role`);

    for (const user of drivers) {
      const existingProfile = await Driver.findOne({ userId: user._id });
      if (!existingProfile) {
        console.log(`Creating missing profile for: ${user.fullName}`);
        await Driver.create({
          userId: user._id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          status: 'ACTIVE'
        });
      } else {
        console.log(`Profile already exists for: ${user.fullName}`);
      }
    }

    console.log('Sync complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing profiles:', err.message);
    process.exit(1);
  }
}

syncDriverProfiles();
