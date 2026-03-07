const User = require('../database/models/user.model');

const ensureSuperAdmin = async () => {
  const email = (process.env.SUPERADMIN_EMAIL || '').trim().toLowerCase();
  const password = (process.env.SUPERADMIN_PASSWORD || '').trim();
  const phoneNumber = (process.env.SUPERADMIN_PHONE || process.env.PHONE_NUMBER || '').trim();
  const fullName = (process.env.SUPERADMIN_NAME || process.env.prodUser || 'Super Admin').trim();

  if (!email || !password || !phoneNumber) {
    console.warn('⚠️ Skipping super admin seed: SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, and PHONE_NUMBER/SUPERADMIN_PHONE are required.');
    return;
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { phoneNumber }],
  });

  if (!existingUser) {
    await User.create({
      fullName,
      email,
      phoneNumber,
      password,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      active: true,
    });
    console.log(`✅ Super admin seeded: ${email}`);
    return;
  }

  let hasUpdates = false;

  if (existingUser.role !== 'SUPER_ADMIN') {
    existingUser.role = 'SUPER_ADMIN';
    hasUpdates = true;
  }

  if (existingUser.status !== 'ACTIVE') {
    existingUser.status = 'ACTIVE';
    hasUpdates = true;
  }

  if (!existingUser.active) {
    existingUser.active = true;
    hasUpdates = true;
  }

  if (hasUpdates) {
    await existingUser.save({ validateBeforeSave: false });
    console.log(`✅ Super admin normalized: ${existingUser.email}`);
    return;
  }

  console.log(`ℹ️ Super admin already exists: ${existingUser.email}`);
};

module.exports = ensureSuperAdmin;