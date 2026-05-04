const AppError = require('../utils/appError');
const Permission = require('../database/models/permission.model');
const Role = require('../database/models/role.model');
const User = require('../database/models/user.model');

/**
 * requireRoles - middleware to allow only users with specified role names
 */
exports.requireRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) return next(new AppError('Not authenticated', 401));

    // Super admin bypass
    if (req.user.role === 'SUPER_ADMIN') return next();

    // If user has legacy role string
    if (req.user.role && allowedRoles.includes(req.user.role)) return next();

    // If user has roles array (object ids), populate and check names
    if (!req.user.roles || !req.user.roles.length) {
      // try to populate
      const fresh = await User.findById(req.user._id).populate('roles', 'name');
      req.user.roles = fresh.roles || [];
    }

    const names = (req.user.roles || []).map(r => r.name);
    for (const r of allowedRoles) if (names.includes(r)) return next();

    return next(new AppError('You do not have permission to perform this action', 403));
  };
};

/**
 * requirePermissions - middleware to allow only users whose roles include the given permission keys
 */
exports.requirePermissions = (...permKeys) => {
  return async (req, res, next) => {
    if (!req.user) return next(new AppError('Not authenticated', 401));
 
    if (req.user.role === 'SUPER_ADMIN') return next();
console.log('Checking permissions for user:', req.user, 'required:', permKeys);
    // Load user roles with permissions if not present
    let populatedUser = req.user;
    if (!req.user.roles || !req.user.roles.length || !req.user.roles[0].permissions) {
      populatedUser = await User.findById(req.user._id).populate({ path: 'roles', populate: { path: 'permissions' } });
      req.user.roles = populatedUser.roles || [];
    }

    const userPerms = new Set();
    for (const role of req.user.roles || []) {
      if (role && role.permissions) {
        for (const p of role.permissions) userPerms.add(typeof p === 'string' ? p : (p.key || p));
      }
    }

    // If permissions are stored as ObjectIds, we need to load Permission keys
    // Build set of keys
    const missingKeys = [];
    for (const k of permKeys) {
      if (!userPerms.has(k)) missingKeys.push(k);
    }

    if (missingKeys.length === 0) return next();

    return next(new AppError('You do not have permission to perform this action', 403));
  };
};
