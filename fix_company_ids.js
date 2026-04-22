const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./src/database/models/user.model');
const Company = require('./src/database/models/company.model');

(async () => {
  await mongoose.connect(process.env.DATABASE_DEV);
  
  // Fix: Set companyId on company admins to the company they own
  const companies = await Company.find().lean();
  
  for (const company of companies) {
    const owner = await User.findById(company.ownerId);
    if (owner && owner.role === 'COMPANY_ADMIN') {
      if (!owner.companyId || owner.companyId.toString() !== company._id.toString()) {
        console.log(`Fixing: User "${owner.fullName}" (${owner._id})`);
        console.log(`  Old companyId: ${owner.companyId}`);
        console.log(`  New companyId: ${company._id} (${company.companyName})`);
        owner.companyId = company._id;
        await owner.save({ validateBeforeSave: false });
        console.log('  ✅ Fixed!');
      } else {
        console.log(`OK: User "${owner.fullName}" already has correct companyId for "${company.companyName}"`);
      }
    }
  }
  
  console.log('\nDone!');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
