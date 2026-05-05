const Permission = require('../database/models/permission.model');
const Role = require('../database/models/role.model');
const User = require('../database/models/user.model');

const defaultPermissions = [
  // Analytics
  { key: 'analytics:read', name: 'Read analytics', description: 'View analytics dashboards' },
  { key: 'analytics:export', name: 'Export analytics', description: 'Export analytics reports' },

  // Orders
  { key: 'orders:create', name: 'Create orders' },
  { key: 'orders:read', name: 'Read orders' },
  { key: 'orders:list', name: 'List orders' },
  { key: 'orders:update', name: 'Update orders' },
  { key: 'orders:assign', name: 'Assign orders' },
  { key: 'orders:export', name: 'Export orders' },

  // Trips
  { key: 'trips:create', name: 'Create trips' },
  { key: 'trips:read', name: 'Read trips' },
  { key: 'trips:list', name: 'List trips' },
  { key: 'trips:update', name: 'Update trips' },
  { key: 'trips:delete', name: 'Delete trips' },
  { key: 'trips:track', name: 'Track trips' },

  // Users
  { key: 'users:list', name: 'List users' },
  { key: 'users:read', name: 'Read user' },
  { key: 'users:update', name: 'Update user' },
  { key: 'users:delete', name: 'Delete user' },
  { key: 'users:roles:assign', name: 'Assign roles to users' },

  // Roles & permissions management
  { key: 'roles:manage', name: 'Manage roles' },
  { key: 'permissions:manage', name: 'Manage permissions' },
  { key: 'permissions:read', name: 'Read permissions' },

  // Contracts
  { key: 'contracts:create', name: 'Create contracts' },
  { key: 'contracts:read', name: 'Read contracts' },
  { key: 'contracts:update', name: 'Update contracts' },
  { key: 'contracts:delete', name: 'Delete contracts' },
  { key: 'contracts:approve', name: 'Approve contracts' },
  { key: 'contracts:terminate', name: 'Terminate contracts' },

  // Geofence
  { key: 'geofence:create', name: 'Create geofence' },
  { key: 'geofence:read', name: 'Read geofence' },
  { key: 'geofence:list', name: 'List geofences' },
  { key: 'geofence:update', name: 'Update geofence' },
  { key: 'geofence:delete', name: 'Delete geofence' },
  { key: 'geofence:check', name: 'Check driver location' },

  // Maintenance
  { key: 'maintenance:create', name: 'Create maintenance log' },
  { key: 'maintenance:read', name: 'Read maintenance logs' },
  { key: 'maintenance:update', name: 'Update maintenance' },
  { key: 'maintenance:delete', name: 'Delete maintenance' },

  // Idle events
  { key: 'idle:read', name: 'Read idle events' },
  { key: 'idle:resolve', name: 'Resolve idle event' },

  // Payments & Transactions
  { key: 'payments:create', name: 'Initialize payment' },
  { key: 'payments:verify', name: 'Verify payment' },
  { key: 'transactions:list', name: 'List transactions' },
  { key: 'transactions:read', name: 'Read transaction' },
  { key: 'transactions:create', name: 'Create transaction' },

  // Vendor / Applications
  { key: 'applications:create', name: 'Create application' },
  { key: 'applications:read', name: 'Read application' },
  { key: 'applications:list', name: 'List applications' },
  { key: 'applications:update', name: 'Update application' },
  { key: 'applications:delete', name: 'Delete application' },
  { key: 'applications:assign', name: 'Assign application to company' },

  // Pricing & Config
  { key: 'pricing:read', name: 'Read pricing' },
  { key: 'pricing:update', name: 'Update pricing' },

  // Wallets
  { key: 'wallet:read', name: 'Read wallets' },
  { key: 'wallet:withdraw', name: 'Create withdrawal' },
  { key: 'wallet:approve', name: 'Approve withdrawal' },
  { key: 'wallet:list', name: 'List wallets' },

  // Commission
  { key: 'commission:read', name: 'Read commission' },
  { key: 'commission:update', name: 'Update commission' },

  // Proposals
  { key: 'proposals:create', name: 'Create proposal' },
  { key: 'proposals:read', name: 'Read proposals' },

  // Audit
  { key: 'audit:view', name: 'View audit logs' },
  
  // Companies & Vehicles
  { key: 'companies:create', name: 'Create companies' },
  { key: 'companies:read', name: 'Read companies' },
  { key: 'companies:list', name: 'List companies' },
  { key: 'companies:update', name: 'Update companies' },
  { key: 'companies:delete', name: 'Delete companies' },
  { key: 'companies:approve', name: 'Approve company' },
  { key: 'companies:users:approve', name: 'Approve company user' },

  // Vehicles
  { key: 'vehicles:create', name: 'Create vehicles' },
  { key: 'vehicles:read', name: 'Read vehicles' },
  { key: 'vehicles:list', name: 'List vehicles' },
  { key: 'vehicles:update', name: 'Update vehicles' },
  { key: 'vehicles:delete', name: 'Delete vehicles' },

  // Drivers (company drivers / driver profile)
  { key: 'drivers:create', name: 'Create drivers' },
  { key: 'drivers:read', name: 'Read drivers' },
  { key: 'drivers:list', name: 'List drivers' },
  { key: 'drivers:update', name: 'Update drivers' },
  { key: 'drivers:delete', name: 'Delete drivers' },
  { key: 'drivers:profile:read', name: 'Read driver profile' },
  { key: 'drivers:profile:update', name: 'Update driver profile' },
  { key: 'drivers:withdrawals:read', name: 'Read driver withdrawals' },
  { key: 'drivers:withdrawals:create', name: 'Create driver withdrawal' },

  // Orders - accept/reject flows and proposals
  { key: 'orders:accept', name: 'Company accept order' },
  { key: 'orders:reject', name: 'Company reject order' },
  { key: 'orders:admin_reject', name: 'Admin reject order' },
  { key: 'orders:proposals:submit', name: 'Submit order proposal' },
  { key: 'orders:proposals:accept', name: 'Accept order proposal' },
  { key: 'orders:proposals:reject', name: 'Reject order proposal' },

  // Broker
  { key: 'broker:create', name: 'Create broker' },
  { key: 'broker:read', name: 'Read broker' },
  { key: 'broker:list', name: 'List brokers' },
  { key: 'broker:update', name: 'Update broker' },
  { key: 'broker:delete', name: 'Delete broker' },

  // Tracking & ratings
  { key: 'tracking:read', name: 'Read tracking info' },
  { key: 'rating:create', name: 'Create rating' },
  { key: 'rating:read', name: 'Read ratings' },

  // Order proposals (general)
  { key: 'proposals:manage', name: 'Manage proposals' },
  
  // Driver commission & wallet
  { key: 'driver:commission:read', name: 'Read driver commission summary' },
  { key: 'driver:commission:history', name: 'Read driver commission history' },
  { key: 'driver:wallet:read', name: 'Read driver wallet' },
];

const defaultRoles = [
  { name: 'SUPER_ADMIN', description: 'Full access', permissions: 'ALL', immutable: true },
  { name: 'COMPANY_ADMIN', description: 'Company-level admin', permissions: [
    'analytics:read','analytics:export','orders:list','orders:read','orders:update','orders:assign','orders:export','trips:read','trips:track','users:list','users:read'
  ] },
  { name: 'VENDOR', description: 'Vendor user', permissions: [
    'analytics:read','orders:list','orders:read','orders:update','orders:export'
  ] },
  { name: 'SHIPPER', description: 'Shipper', permissions: ['orders:create','orders:read','orders:list'] },
  { name: 'DRIVER', description: 'Driver', permissions: ['trips:read','trips:track','trips:update'] },
  { name: 'AUDITOR', description: 'Read-only auditor', permissions: ['analytics:read','orders:list','audit:view'] }
];

const ensureRolesAndPermissions = async () => {
  // Upsert permissions
  const permMap = {};
  for (const p of defaultPermissions) {
    let perm = await Permission.findOne({ key: p.key });
    if (!perm) perm = await Permission.create(p);
    permMap[p.key] = perm;
  }

  // Create roles
  for (const r of defaultRoles) {
    let role = await Role.findOne({ name: r.name });
    if (!role) {
      const perms = [];
      if (r.permissions === 'ALL') {
        // attach all permissions
        const all = await Permission.find();
        all.forEach(x => perms.push(x._id));
      } else {
        for (const key of r.permissions) {
          if (permMap[key]) perms.push(permMap[key]._id);
        }
      }
      role = await Role.create({ name: r.name, description: r.description, permissions: perms, immutable: !!r.immutable });
    } else {
      // ensure permissions present
      const perms = role.permissions.map(String);
      let changed = false;
      if (r.permissions === 'ALL') {
        const all = await Permission.find();
        const allIds = all.map(x => String(x._id));
        for (const id of allIds) if (!perms.includes(id)) { perms.push(id); changed = true; }
      } else {
        for (const key of r.permissions) {
          const id = permMap[key]._id.toString();
          if (!perms.includes(id)) { perms.push(id); changed = true; }
        }
      }
      if (changed) {
        role.permissions = perms;
        await role.save();
      }
    }
  }

  // Attach SUPER_ADMIN role to SUPER_ADMIN user(s)
  const superRole = await Role.findOne({ name: 'SUPER_ADMIN' });
  if (superRole) {
    const superUsers = await User.find({ role: 'SUPER_ADMIN' });
    for (const u of superUsers) {
      const has = (u.roles || []).map(String).includes(String(superRole._id));
      if (!has) {
        u.roles = u.roles || [];
        u.roles.push(superRole._id);
        await u.save({ validateBeforeSave: false });
      }
    }
  }

  console.log('✅ Roles and permissions seeded/updated');
};

module.exports = ensureRolesAndPermissions;
