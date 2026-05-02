const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const mongoose = require('mongoose');
const Maintenance = require('../database/models/maintenance.model');
const Driver = require('../database/models/driver.model');
const Vehicle = require('../database/models/vehicle.model');
const { uploadMulterFile } = require('../utils/cloudinaryUpload');

// GET /api/v1/fleet/maintenance
exports.getMaintenanceLogs = catchAsync(async (req, res, next) => {
  const filter = {};
  // If the user is a company admin, restrict to their company
  if (req.user && req.user.role === 'COMPANY_ADMIN') {
    if (!req.user.companyId) return next(new AppError('No company associated with this user', 404));
    filter.companyId = req.user.companyId;
  }

  const logs = await Maintenance.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ status: 'success', results: logs.length, data: logs });
});

// POST /api/v1/fleet/maintenance
exports.createMaintenance = catchAsync(async (req, res, next) => {
  const { vehicleId, maintenanceType, status, cost, technician, notes, performedAt } = req.body;
  if (!vehicleId || !maintenanceType) return next(new AppError('vehicleId and maintenanceType are required', 400));

  const doc = await Maintenance.create({
    vehicleId,
    maintenanceType,
    status: status || 'scheduled',
    cost: cost || 0,
    technician: technician || null,
    notes: notes || '',
    performedAt: performedAt || null,
    companyId: req.user ? req.user.companyId : undefined,
    createdBy: req.user ? req.user._id : undefined,
  });

  res.status(201).json({ status: 'success', data: doc });
});

// PATCH /api/v1/fleet/maintenance/:id
exports.updateMaintenance = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return next(new AppError('Invalid id', 400));
  const doc = await Maintenance.findById(id);
  if (!doc) return next(new AppError('Maintenance record not found', 404));

  // Basic company check
  if (req.user && req.user.role === 'COMPANY_ADMIN' && String(req.user.companyId) !== String(doc.companyId)) {
    return next(new AppError('Not allowed', 403));
  }

  const updates = req.body;
  Object.assign(doc, updates);
  await doc.save();
  res.status(200).json({ status: 'success', data: doc });
});

// DELETE /api/v1/fleet/maintenance/:id
exports.deleteMaintenance = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return next(new AppError('Invalid id', 400));
  const doc = await Maintenance.findById(id);
  if (!doc) return next(new AppError('Maintenance record not found', 404));

  if (req.user && req.user.role === 'COMPANY_ADMIN' && String(req.user.companyId) !== String(doc.companyId)) {
    return next(new AppError('Not allowed', 403));
  }

  await doc.remove();
  res.status(204).json({ status: 'success', data: null });
});

// POST /api/v1/driver/maintenance/report
exports.reportMaintenance = catchAsync(async (req, res, next) => {
  // req.user is the User; find Driver profile
  const driver = await Driver.findOne({ userId: req.user._id });
  if (!driver) return next(new AppError('Driver profile not found', 404));

  const { maintenanceType, notes } = req.body;
  // Accept plateNumber from driver instead of requiring assigned vehicle
  const { plateNumber } = req.body;
  if (!plateNumber) return next(new AppError('plateNumber is required', 400));
  if (!maintenanceType) return next(new AppError('maintenanceType is required', 400));

  // Find vehicle by plate number (case-insensitive)
  const vehicle = await Vehicle.findOne({ plateNumber: { $regex: `^${plateNumber}$`, $options: 'i' } });
  if (!vehicle) return next(new AppError('Vehicle with provided plate number not found', 404));
  const vehicleId = vehicle._id;

  // Handle file uploads (req.files via multer)
  const attachments = [];
  if (req.files && Array.isArray(req.files)) {
    for (const f of req.files) {
      try {
        const uploaded = await uploadMulterFile(f, { folder: 'maintenance-reports' });
        if (uploaded) {
          attachments.push({ url: uploaded.secure_url || uploaded.url, public_id: uploaded.public_id });
        }
      } catch (err) {
        // continue but log
        console.error('Upload failed for file', f.originalname, err.message || err);
      }
    }
  }

  const doc = await Maintenance.create({
    vehicleId,
    maintenanceType,
    status: 'reported',
    notes: notes || '',
    attachments,
    companyId: driver.companyId,
    createdBy: req.user._id,
  });

  res.status(201).json({ status: 'success', data: doc });
});

// GET /api/v1/driver/maintenance - returns maintenance reports created by the authenticated driver
exports.getMyReports = catchAsync(async (req, res, next) => {
  const driver = await Driver.findOne({ userId: req.user._id });
  if (!driver) return next(new AppError('Driver profile not found', 404));

  const reports = await Maintenance.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ status: 'success', results: reports.length, data: reports });
});
