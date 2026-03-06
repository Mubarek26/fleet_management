const AppError = require('../utils/appError'); 
const catchAsync = require('../utils/catchAsync');
const Restaurant = require('../models/restaurants');

// normalize roles
const normalizeRole = (role) => {
  if (!role) return "";
  return role.trim().toLowerCase();
};

const restrictToRoles = catchAsync(async (req, res, next) => {
  const role = normalizeRole(req.user.role);

  if (role === "superadmin") {
    // superadmin → no restriction
    return next();
  }

  if (role === "owner") {
    // owner → fetch their restaurant(s)
    const restaurants = await Restaurant.find({ ownerId: req.user.id }, { _id: 1 });
    if (!restaurants.length) {
      return next(new AppError("No restaurant assigned to this owner", 404));
    }

    req.ownerRestaurantIds = restaurants.map(r => r._id); // attach IDs
    return next();
  }

  // any other role → forbidden
  return next(new AppError("Unauthorized role", 403));
});

module.exports = restrictToRoles;
