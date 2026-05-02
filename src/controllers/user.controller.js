const express = require('express');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory.controller'); // Import the handler factory
const User = require('../database/models/user.model');
const { uploadMulterFile } = require('../utils/cloudinaryUpload');
// const { use } = require('react');
const router = express.Router();
// const fs = require('fs');


exports.getMe = (req, res, next) => {
  req.params.id = req.user.id; // Set the user ID to the authenticated user's ID
  next(); // Call the next middleware function
}

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. create error if user posts password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatePassword.',
        400
      )
    );
  }
  let photo;
  if (req.file) {
    const upload = await uploadMulterFile(req.file, { folder: 'users' });
    photo = upload?.secure_url;
  }
  // 2. Filter out unwanted fields names that are not allowed to be updated
  const filteredBody = {};
  const allowedFields = ['fullName', 'photo', 'status', 'phoneNumber'];
  Object.keys(req.body).forEach((el) => {
    if (allowedFields.includes(el)) filteredBody[el] = req.body[el];
  });
  if (photo) {
    filteredBody.photo = photo;
  }

  // 3. update user document
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true, // return the updated document
    runValidators: true,
  });
  const { email, status, fullName, role, phoneNumber } = updatedUser;
  const photoField = updatedUser.photo;

  res.status(200).json({
    status: 'success',
    data: {
      updatedUser: {
        email,
        status,
        fullName,
        role,
        phoneNumber,
        photo: photoField,
        // ...updatedUser._doc,
      },
    },
  });
});



exports.deleteMe = catchAsync(async (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    return next(new AppError('Cannot deactivate a superadmin account', 403));
  }

  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    message: 'User deleted successfully',
  });
});


const APIFeatures = require('../utils/apiFeatures');
const Driver = require('../database/models/driver.model');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  let filter = {};
  const baseQuery = User.find(filter).select('-password');

  // Build features for paginated results
  const features = new APIFeatures(baseQuery, req.query).filter().sort().limitFields().paginate();
  const users = await features.query;

  // Build features for counting total matching documents (no pagination)
  const countFeatures = new APIFeatures(User.find(filter), req.query).filter().limitFields();
  const totalResults = await countFeatures.query.countDocuments();

  // Convert Mongoose documents to plain objects so added fields are serialized
  const usersPlain = users.map((u) => (u && typeof u.toObject === 'function' ? u.toObject() : u));

  // DEBUG: log counts for troubleshooting frontend visibility
  try {
    console.log(`[getAllUsers] fetched users: ${usersPlain.length}`);
  } catch (err) {
    // ignore logging errors
  }

  // For any users with role DRIVER (case-insensitive), fetch driver profile and attach isPrivateTransporter
  const driverUsers = users.filter((u) => String(u.role || '').toUpperCase() === 'DRIVER');
  if (driverUsers.length > 0) {
    const userIds = driverUsers.map((u) => u._id);
    const userEmails = driverUsers.map((u) => u.email).filter(Boolean);
    const userPhones = driverUsers.map((u) => u.phoneNumber).filter(Boolean);

    const queryOr = [];
    if (userIds.length) queryOr.push({ userId: { $in: userIds } });
    if (userEmails.length) queryOr.push({ email: { $in: userEmails } });
    if (userPhones.length) queryOr.push({ phoneNumber: { $in: userPhones } });

    let lookups = [];
    if (queryOr.length > 0) {
      lookups = await Driver.find({ $or: queryOr }).select('userId email phoneNumber isPrivateTransporter');
    }

    console.log(`[getAllUsers] driverProfiles found: ${lookups.length}`);

    const byUserId = new Map();
    const byEmail = new Map();
    const byPhone = new Map();

    lookups.forEach((d) => {
      if (d.userId) byUserId.set(String(d.userId), d.isPrivateTransporter);
      if (d.email) byEmail.set(String(d.email).toLowerCase(), d.isPrivateTransporter);
      if (d.phoneNumber) byPhone.set(String(d.phoneNumber), d.isPrivateTransporter);
    });

    usersPlain.forEach((u) => {
      if (String(u.role || '').toUpperCase() === 'DRIVER') {
        const uid = String(u._id);
        const email = (u.email || '').toLowerCase();
        const phone = u.phoneNumber || '';

        let flag = false;
        if (byUserId.has(uid)) flag = byUserId.get(uid);
        else if (email && byEmail.has(email)) flag = byEmail.get(email);
        else if (phone && byPhone.has(phone)) flag = byPhone.get(phone);

        u.isPrivateTransporter = !!flag;
      }
    });
  }

  res.status(200).json({
    status: 'success',
    results: usersPlain.length,
    meta: {
      totalResults,
      page: req.query.page * 1 || 1,
      limit: req.query.limit * 1 || 27,
      totalPages: Math.ceil(totalResults / (req.query.limit * 1 || 27)),
    },
    data: {
      data: usersPlain,
    },
  });
});
exports.getUser = factory.getOne(User); // Use the getOne factory function to get a user
exports.updateUsers = factory.updateOne(User); // Use the updateOne factory function to handle updates
exports.deleteUsers = factory.deleteOne(User); // Use the deleteOne factory function to handle deletion

