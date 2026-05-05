const catchAsync = require('../utils/catchAsync');
const Permission = require('../database/models/permission.model');
const AppError = require('../utils/appError');

exports.listPermissions = catchAsync(async (req, res, next) => {
  const perms = await Permission.find().sort({ key: 1 });
  res.status(200).json({ status: 'success', data: perms });
});

exports.createPermission = catchAsync(async (req, res, next) => {
  const { key, name, description } = req.body;
  if (!key || !name) return next(new AppError('key and name are required', 400));
  const existing = await Permission.findOne({ key });
  if (existing) return next(new AppError('Permission key already exists', 409));
  const perm = await Permission.create({ key, name, description });
  res.status(201).json({ status: 'success', data: perm });
});
