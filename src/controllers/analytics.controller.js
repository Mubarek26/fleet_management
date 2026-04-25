const Vehicle = require('../database/models/vehicle.model');
const Trip = require('../database/models/trip.model');
const Driver = require('../database/models/driver.model');
const Company = require('../database/models/company.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getFleetStatus = catchAsync(async (req, res, next) => {
    let companyId = req.user.companyId;

    if (req.user.role === 'COMPANY_ADMIN' && !companyId) {
        const company = await Company.findOne({ ownerId: req.user._id });
        if (company) companyId = company._id;
    }

    if (!companyId && req.user.role !== 'SUPER_ADMIN') {
        return next(new AppError('No company found for this user', 404));
    }

    const query = req.user.role === 'SUPER_ADMIN' ? {} : { companyId };
    
    const vehicles = await Vehicle.find(query).populate('currentDriverId');

    const fleetData = await Promise.all(vehicles.map(async (vehicle) => {
        // Find latest trip for this vehicle to get location
        const latestTrip = await Trip.findOne({ vehicleId: vehicle._id })
            .sort({ createdAt: -1 })
            .select('location');

        return {
            id: vehicle.plateNumber,
            type: vehicle.vehicleType,
            driver: vehicle.currentDriverId ? vehicle.currentDriverId.fullName : 'No Driver Assigned',
            status: vehicle.status.toLowerCase(),
            fuel: vehicle.fuel || 0,
            location: latestTrip?.location ? `Lng: ${latestTrip.location.coordinates[0].toFixed(4)}, Lat: ${latestTrip.location.coordinates[1].toFixed(4)}` : 'Unknown',
            mileage: `${(vehicle.mileage || 0).toLocaleString()} mi`
        };
    }));

    const summary = {
        active: fleetData.filter(v => v.status === 'active').length,
        maintenance: fleetData.filter(v => v.status === 'maintenance').length,
        available: fleetData.filter(v => v.status === 'inactive' || v.status === 'active' && v.driver === 'No Driver Assigned').length, // Simple logic for available
    };

    res.status(200).json({
        status: 'success',
        data: {
            summary,
            vehicles: fleetData
        }
    });
});
