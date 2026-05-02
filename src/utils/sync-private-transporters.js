const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Driver = require('../database/models/driver.model');

async function markPrivateTransporters() {
  try {
    const dbUri = process.env.DATABASE_DEV || process.env.DATABASE_LOCAL;
    if (!dbUri) {
      throw new Error('DATABASE_DEV or DATABASE_LOCAL is not defined in .env file');
    }

    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB');

    // Criteria: drivers with a vehicle, or license info, or uploaded photos
    const filter = {
      $or: [
        { currentVehicleId: { $ne: null } },
        { licenseNumber: { $exists: true, $ne: null } },
        { licensePhoto: { $exists: true, $ne: null } },
        { driverPhoto: { $exists: true, $ne: null } }
      ]
    };

    const result = await Driver.updateMany(filter, { $set: { isPrivateTransporter: true } });
    console.log(`Marked ${result.modifiedCount || result.nModified || 0} drivers as private transporters`);

    console.log('Sync complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing private transporters:', err.message || err);
    process.exit(1);
  }
}

markPrivateTransporters();
