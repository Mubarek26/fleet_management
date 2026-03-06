const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    // Prevent deleting a superadmin user
    if (doc.role && doc.role === 'superadmin') {
      return next(new AppError('Cannot delete a superadmin user', 403));
    }

    // If deleting a User, unassign them from any restaurants they own
    if (Model.modelName === 'User') {
      try {
        const Restaurant = require('../models/restaurants');
        await Restaurant.updateMany({ ownerId: doc._id }, { $set: { ownerId: null } });
      } catch (err) {
        // Log the error but continue with deletion; do not block user deletion for a cascade failure
        console.error('Error unassigning restaurants for deleted user:', err);
      }
    }

    await Model.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

  
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // Load the document first to check role-based protections
    const existing = await Model.findById(req.params.id).select('+password');
    if (!existing) {
      return next(new AppError('No document found with that ID', 404));
    }

    const isSuperAdmin = existing.role && existing.role === 'superadmin';

    // Prevent anyone except the superadmin themselves from editing that account
    if (isSuperAdmin && (!req.user || String(req.user._id) !== String(existing._id))) {
      return next(new AppError('Only the superadmin can edit their own account', 403));
    }

    if (isSuperAdmin && Object.prototype.hasOwnProperty.call(req.body, 'role')) {
      const requestedRole = req.body.role;
      const isRoleChange = requestedRole && requestedRole !== existing.role;

      if (isRoleChange) {
        return next(new AppError('Cannot edit role of a superadmin user', 403));
      }

      // Drop no-op role field so superadmin profile updates still work when role is sent from forms
      delete req.body.role;
    }

    if (isSuperAdmin && Object.prototype.hasOwnProperty.call(req.body, 'active')) {
      const requestedActive = req.body.active;
      const wantsInactive =
        requestedActive === false ||
        requestedActive === 0 ||
        requestedActive === 'false' ||
        requestedActive === '0';

      if (wantsInactive) {
        return next(new AppError('Cannot deactivate a superadmin user', 403));
      }
    }
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // return the updated document
      // runValidators: true, // run schema validators
    }).select("+password");
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });


exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });
  
exports.getAll = (Model) =>
    catchAsync(async (req, res, next) => {
      // to allow for nested GET reviews on tour (hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId }; // Filter reviews by tour ID if provided
    const baseQuery = Model.find(filter);
    if (Model.modelName === 'User') {
      baseQuery.select('+active'); // include active flag for user listings
    }

    const features = new APIFeatures(baseQuery, req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate(); // Create an instance of APIFeatures with the Tour model and query string
    const doc = await features.query; // Execute the query
    // console.log(`This is the api features ${JSON.stringify(features.queryString)}`)
    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime, // Assuming you
      //  set this in middleware
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
