const express = require('express');
const authController = require('../controllers/auth.controller');
const factory = require('./handlerFactory.controller'); // Import the handler factory
const Company = require('../database/models/company.model');
const User = require('../database/models/user.model');
const Driver = require('../database/models/driver.model');
const Vehicle = require('../database/models/vehicle.model');
const router = express.Router();
const appError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');

// create a company
exports.createCompany = catchAsync(async (req, res, next) => {
    if (!req.user?._id) {
        return next(new appError('You must be logged in to create a company', 401));
    }

    if (req.user.role !== 'COMPANY_ADMIN') {
        return next(new appError('Only COMPANY_ADMIN users can create a company', 403));
    }

    const payload = {
        ...req.body,
        ownerId: req.user._id
    };

    const newCompany = await Company.create(payload);

    await User.findByIdAndUpdate(
        req.user._id,
        { companyId: newCompany._id },
        { new: true, runValidators: true }
    );

    res.status(201).json({
        status: 'success',
        data: {
            company: newCompany
        }
    });

});

// get a company
exports.getCompany = catchAsync(async (req, res, next) => {
    const company = await Company.findById(req.params.id);

    if (!company) {
        return next(new appError('No company found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            company
        }
    });

});

// get all companies
exports.getAllCompanies = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Company.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const companies = await features.query;
    res.status(200).json({
        status: 'success',
        results: companies.length,
        data: {
            companies
        }
    });
});

// update a company
exports.updateCompany = catchAsync(async (req, res, next) => {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!company) {
        return next(new appError('No company found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            company
        }
    });
});

// delete a company
exports.deleteCompany = catchAsync(async (req, res, next) => {
    const company = await Company.findByIdAndUpdate(req.params.id);
    if (!company) {
        return next(new appError('No company found with that ID', 404));
    }
    // Optionally, you could set the company to inactive instead of deleting it
    company.active = false;
     await company.save();
    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Allow Company admins to add drivers to their company
exports.addDriverToCompany = catchAsync(async (req, res, next) => {
    const company = await Company.findById(req.params.id);
    if (!company) {
        return next(new appError('No company found with that ID', 404));
    }

    const { fullName, phoneNumber, email, password, licenseNumber, status, userStatus } = req.body;
    const driverPhoto = req.files?.driverPhoto?.[0]?.filename || req.body.driverPhoto || null;
    const licensePhoto = req.files?.licensePhoto?.[0]?.filename || req.body.licensePhoto || null;

    if (!fullName || !phoneNumber || !email || !password) {
        return next(new appError('fullName, phoneNumber, email and password are required', 400));
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
        $or: [{ phoneNumber }, { email: normalizedEmail }]
    });

    if (existingUser) {
        return next(new appError('User with this phone number or email already exists', 400));
    }

    const existingDriver = await Driver.findOne({
        $or: [{ phoneNumber }, { email: email.toLowerCase() }]
    });

    if (existingDriver) {
        return next(new appError('Driver with this phone number or email already exists', 400));
    }

    const user = await User.create({
        fullName,
        phoneNumber,
        email: normalizedEmail,
        password,
        role: 'DRIVER',
        companyId: company._id,
        status: userStatus || 'ACTIVE'
    });

    let driver;
    try {
        driver = await Driver.create({
            userId: user._id,
            fullName,
            phoneNumber,
            email: normalizedEmail,
            companyId: company._id,
            licenseNumber,
            driverPhoto,
            licensePhoto,
            status,
            active: true
        });
    } catch (error) {
        await User.findByIdAndDelete(user._id);
        throw error;
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
        status: 'success',
        data: {
            company,
            user: userResponse,
            driver
        }
    });


}) 

// get company drivers
exports.getCompanyDrivers = catchAsync(async (req, res, next) => {
    // First, find the company by ID
    const company = await Company.findById(req.params.id);
    if (!company) {
        return next(new appError('No company found with that ID', 404));
    }

    // Continue with the rest of the logic to fetch drivers for the company
    const drivers = await Driver.find({ companyId: company._id });

    res.status(200).json({
        status: 'success',
        results: drivers.length,
        data: {
            drivers
        }
    });
});



// update company driver
exports.updateCompanyDriver = catchAsync(async (req, res, next) => {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
        return next(new appError('No driver found with that ID', 404));
    }
    const { fullName, phoneNumber, email, licenseNumber, status, userStatus } = req.body;
    const driverPhoto = req.files?.driverPhoto?.[0]?.filename || req.body.driverPhoto || driver.driverPhoto;
    const licensePhoto = req.files?.licensePhoto?.[0]?.filename || req.body.licensePhoto || driver.licensePhoto;
    if (fullName) driver.fullName = fullName;
    if (phoneNumber) driver.phoneNumber = phoneNumber;
    if (email) driver.email = email.toLowerCase();
    if (licenseNumber) driver.licenseNumber = licenseNumber;
    if (status) driver.status = status;
    if (userStatus) driver.userStatus = userStatus;
    driver.driverPhoto = driverPhoto;
    driver.licensePhoto = licensePhoto;

    await driver.save();

    res.status(200).json({
        status: 'success',
        data: {
            driver
        }
    });
});


exports.createCompanyVehicle = catchAsync(async (req, res, next) => {
    let companyId = req.user?.companyId;

    if (req.user?._id && req.user?.role === 'COMPANY_ADMIN') {
        const ownedCompany = await Company.findOne({ ownerId: req.user._id });
        companyId = ownedCompany?._id;
    }

    if (!companyId) {
        return next(new appError('Authenticated user is not linked to a company', 400));
    }

    const company = await Company.findById(companyId);
    if (!company) {
        return next(new appError('No company found for the authenticated user', 404));
    }

    const { plateNumber, vehicleType, model, capacityKg, status } = req.body;

    if (!plateNumber || !vehicleType) {
        return next(new appError('plateNumber and vehicleType are required', 400));
    }

    const existingVehicle = await Vehicle.findOne({ plateNumber: plateNumber.toUpperCase() });
    if (existingVehicle) {
        return next(new appError('Vehicle with this plate number already exists', 400));
    }

    const vehicle = await Vehicle.create({
        companyId,
        plateNumber,
        vehicleType,
        model,
        capacityKg,
        status
    });

    await Company.findByIdAndUpdate(companyId, { $inc: { numberOfCars: 1 } });

    res.status(201).json({
        status: 'success',
        data: {
            vehicle
        }
    });
});
    



exports.getCompanyVehicles = catchAsync(async (req, res, next) => {
    let companyId = req.user?.companyId;
    // If the user is a company admin, find the company they own and use that ID
    if (req.user?._id && req.user?.role === 'COMPANY_ADMIN') {
        const ownedCompany = await Company.findOne({ ownerId: req.user._id });
        companyId = ownedCompany?._id;
    }
    // If we still don't have a company ID, return an error
    if (!companyId) {
        return next(new appError('Authenticated user is not linked to a company', 400));
    }
    const company = await Company.findById(companyId);
    if (!company) {
        return next(new appError('No company found for the authenticated user', 404));
    }
    // Continue with the rest of the logic to fetch vehicles for the company
    const vehicles = await Vehicle.find({ companyId });
    res.status(200).json({
        status: 'success',
        results: vehicles.length,
        data: {
            vehicles
        }
    });
})
