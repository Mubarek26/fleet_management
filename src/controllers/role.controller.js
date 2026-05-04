const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Role = require('../database/models/role.model');
const Permission = require('../database/models/permission.model');
const User = require('../database/models/user.model');

exports.listRoles = catchAsync(async (req, res, next) => {
  const roles = await Role.find().populate('permissions');
  res.status(200).json({ status: 'success', data: roles });
});

exports.getRole = catchAsync(async (req, res, next) => {
  const role = await Role.findById(req.params.id).populate('permissions');
  if (!role) return next(new AppError('Role not found', 404));
  res.status(200).json({ status: 'success', data: role });
});

exports.createRole = catchAsync(async (req, res, next) => {
  const { name, description, permissions } = req.body;
  if (!name) return next(new AppError('Role name required', 400));
  const permDocs = permissions && permissions.length ? await Permission.find({ key: { $in: permissions } }) : [];
  const role = await Role.create({ name, description, permissions: permDocs.map(p => p._id) });
  res.status(201).json({ status: 'success', data: role });
});

exports.updateRole = catchAsync(async (req, res, next) => {
  const { name, description, permissions } = req.body;
  const role = await Role.findById(req.params.id);
  if (!role) return next(new AppError('Role not found', 404));
  if (role.immutable) return next(new AppError('Cannot modify immutable role', 403));
  if (name) role.name = name;
  if (description) role.description = description;
  if (permissions) {
    const permDocs = await Permission.find({ key: { $in: permissions } });
    role.permissions = permDocs.map(p => p._id);
  }
  await role.save();
  res.status(200).json({ status: 'success', data: role });
});

exports.deleteRole = catchAsync(async (req, res, next) => {
  const role = await Role.findById(req.params.id);
  if (!role) return next(new AppError('Role not found', 404));
  if (role.immutable) return next(new AppError('Cannot delete immutable role', 403));
  await role.remove();
  res.status(204).json({ status: 'success' });
});

exports.assignRoleToUser = catchAsync(async (req, res, next) => {
  const { userId } = req.body;
  if (!userId) return next(new AppError('userId is required', 400));
  const role = await Role.findById(req.params.id);
  if (!role) return next(new AppError('Role not found', 404));
  const user = await User.findById(userId);
  if (!user) return next(new AppError('User not found', 404));
  user.roles = user.roles || [];
  if (!user.roles.map(String).includes(String(role._id))) {
    user.roles.push(role._id);
    await user.save({ validateBeforeSave: false });
  }
  res.status(200).json({ status: 'success', data: user });
});
