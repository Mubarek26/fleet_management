const mongoose = require('mongoose');
const IdleEvent = require('../database/models/idleEvent.model');
const Trip = require('../database/models/trip.model');
const Company = require('../database/models/company.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllIdleEvents = catchAsync(async (req, res, next) => {
    let companyId = req.user.companyId;

    if (req.user.role === 'COMPANY_ADMIN' && !companyId) {
        const company = await Company.findOne({ ownerId: req.user._id });
        if (company) companyId = company._id;
    }

    if (!companyId && req.user.role !== 'SUPER_ADMIN') {
        return next(new AppError('No company found for this user', 404));
    }

    // If SUPER_ADMIN, they can see everything.
    // If COMPANY_ADMIN, we need to filter by companyId.
    // Since IdleEvent doesn't have companyId, we must populate Trip and Vehicle.

    let query = {};
    
    // We'll use aggregation to filter by companyId through Trip and Vehicle
    const pipeline = [];

    if (req.user.role !== 'SUPER_ADMIN') {
        pipeline.push(
            {
                $lookup: {
                    from: 'trips',
                    localField: 'tripId',
                    foreignField: '_id',
                    as: 'trip'
                }
            },
            { $unwind: '$trip' },
            {
                $lookup: {
                    from: 'vehicles',
                    localField: 'trip.vehicleId',
                    foreignField: '_id',
                    as: 'vehicle'
                }
            },
            { $unwind: '$vehicle' },
            {
                $match: {
                    'vehicle.companyId': new mongoose.Types.ObjectId(companyId)
                }
            }
        );
    } else {
        // Just populate for Super Admin
        pipeline.push(
            {
                $lookup: {
                    from: 'trips',
                    localField: 'tripId',
                    foreignField: '_id',
                    as: 'trip'
                }
            },
            { $unwind: '$trip' },
            {
                $lookup: {
                    from: 'vehicles',
                    localField: 'trip.vehicleId',
                    foreignField: '_id',
                    as: 'vehicle'
                }
            },
            { $unwind: '$vehicle' }
        );
    }

    // Always lookup driver
    pipeline.push(
        {
            $lookup: {
                from: 'users',
                localField: 'driverId',
                foreignField: '_id',
                as: 'driver'
            }
        },
        { $unwind: '$driver' },
        { $sort: { createdAt: -1 } }
    );

    const idleEvents = await IdleEvent.aggregate(pipeline);

    res.status(200).json({
        status: 'success',
        results: idleEvents.length,
        data: {
            idleEvents
        }
    });
});

exports.resolveIdleEvent = catchAsync(async (req, res, next) => {
    const idleEvent = await IdleEvent.findById(req.params.id);

    if (!idleEvent) {
        return next(new AppError('No idle event found with that ID', 404));
    }

    idleEvent.resolved = true;
    idleEvent.resolvedAt = Date.now();
    idleEvent.notes = req.body.notes || idleEvent.notes;
    
    await idleEvent.save();

    // Reset isIdle on the associated Trip
    await Trip.findByIdAndUpdate(idleEvent.tripId, { isIdle: false });

    res.status(200).json({
        status: 'success',
        data: {
            idleEvent
        }
    });
});
