const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Trip = require('./src/database/models/trip.model');
const Order = require('./src/database/models/order.model');
const User = require('./src/database/models/user.model');
const Company = require('./src/database/models/company.model');

(async () => {
  const uri = process.env.DATABASE_DEV;
  console.log('Connecting to:', uri ? uri.substring(0, 40) + '...' : 'UNDEFINED');
  await mongoose.connect(uri);
  console.log('=== DEBUG: Database State ===\n');

  const totalTrips = await Trip.countDocuments();
  console.log('Total trips:', totalTrips);

  if (totalTrips > 0) {
    const sampleTrips = await Trip.find().limit(5).lean();
    sampleTrips.forEach(t => {
      console.log('  Trip', t._id, '| orderId:', t.orderId, '| driverId:', t.driverId, '| milestone:', t.milestone);
    });
  }

  const totalOrders = await Order.countDocuments();
  console.log('\nTotal orders:', totalOrders);

  // Orders with targetCompanyId set
  const ordersWithCompany = await Order.find({ targetCompanyId: { $ne: null } })
    .select('_id targetCompanyId assignmentMode status')
    .lean();
  console.log('Orders with non-null targetCompanyId:', ordersWithCompany.length);
  ordersWithCompany.forEach(o => {
    console.log('  Order', o._id, '| target:', o.targetCompanyId, '| mode:', o.assignmentMode, '| status:', o.status);
  });

  // All company admins
  const companyAdmins = await User.find({ role: 'COMPANY_ADMIN' })
    .select('_id fullName companyId email')
    .lean();
  console.log('\nCompany admins:', companyAdmins.length);
  companyAdmins.forEach(u => {
    console.log('  User', u._id, u.fullName, '| companyId:', u.companyId, '| email:', u.email);
  });

  // All companies
  const companies = await Company.find().select('_id companyName ownerId status').lean();
  console.log('\nCompanies:', companies.length);
  companies.forEach(c => {
    console.log('  Company', c._id, c.companyName, '| ownerId:', c.ownerId, '| status:', c.status);
  });

  // Cross-check: do any trip orderId match orders with targetCompanyId?
  if (ordersWithCompany.length > 0 && totalTrips > 0) {
    const targetOrderIds = ordersWithCompany.map(o => o._id);
    const matchingTrips = await Trip.find({ orderId: { $in: targetOrderIds } }).lean();
    console.log('\nTrips whose orderId matches a company-targeted order:', matchingTrips.length);
  }

  // Check if companyId on company admins matches any company _id
  for (const admin of companyAdmins) {
    if (admin.companyId) {
      const company = await Company.findById(admin.companyId).lean();
      console.log(`\n  Admin "${admin.fullName}" companyId ${admin.companyId} -> Company: ${company ? company.companyName : 'NOT FOUND'}`);
    } else {
      console.log(`\n  Admin "${admin.fullName}" has NO companyId set!`);
    }
  }

  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
