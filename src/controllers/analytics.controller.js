const Vehicle = require('../database/models/vehicle.model');
const Trip = require('../database/models/trip.model');
const Driver = require('../database/models/driver.model');
const Company = require('../database/models/company.model');
const Order = require('../database/models/order.model');
const User = require('../database/models/user.model');
const mongoose = require('mongoose');
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

exports.getDashboardStats = catchAsync(async (req, res, next) => {
    const { startDate, endDate, timeRange } = req.query;
    let queryStartDate = new Date();
    let queryEndDate = new Date();

    // 1. Determine Time Range
    if (timeRange === '7d') {
        queryStartDate.setDate(queryStartDate.getDate() - 7);
    } else if (timeRange === '30d') {
        queryStartDate.setDate(queryStartDate.getDate() - 30);
    } else if (timeRange === '90d') {
        queryStartDate.setDate(queryStartDate.getDate() - 90);
    } else if (timeRange === '1y') {
        queryStartDate.setFullYear(queryStartDate.getFullYear() - 1);
    } else if (startDate && endDate) {
        queryStartDate = new Date(startDate);
        queryEndDate = new Date(endDate);
    } else {
        // Default to last 30 days
        queryStartDate.setDate(queryStartDate.getDate() - 30);
    }

    // 2. Build Role-Based Filter
    let filter = {
        createdAt: { $gte: queryStartDate, $lte: queryEndDate }
    };

    let companyId = req.user.companyId;
    if (req.user.role === 'COMPANY_ADMIN' && !companyId) {
        const company = await Company.findOne({ ownerId: req.user._id });
        if (company) companyId = company._id;
    }

    if (req.user.role === 'COMPANY_ADMIN') {
        if (!companyId) return next(new AppError('No company found for this admin', 404));
        const cId = new mongoose.Types.ObjectId(companyId);
        filter.$or = [
            { targetCompanyId: cId },
            { createdBy: req.user._id }
        ];
    } else if (req.user.role === 'VENDOR' || req.user.role === 'SHIPPER') {
        filter.createdBy = req.user._id;
    } else if (req.user.role === 'SUPER_ADMIN') {
        if (req.query.companyId && mongoose.Types.ObjectId.isValid(req.query.companyId)) {
            const cId = new mongoose.Types.ObjectId(req.query.companyId);
            filter.$or = [
                { targetCompanyId: cId },
                { createdBy: cId }
            ];
        }
    }

    // 3. Fetch Stats
    const totalOrders = await Order.countDocuments(filter);

    const activeShipments = await Order.countDocuments({
        ...filter,
        status: { $in: ['IN_TRANSIT', 'ASSIGNED', 'MATCHED'] }
    });

    const deliveredToday = await Order.countDocuments({
        ...filter,
        status: 'DELIVERED',
        updatedAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lte: new Date(new Date().setHours(23, 59, 59, 999))
        }
    });

    const pendingOrders = await Order.countDocuments({
        ...filter,
        status: 'PENDING'
    });

    const completedOrders = await Order.countDocuments({
        ...filter,
        status: 'COMPLETED'
    });

    const rejectedOrders = await Order.countDocuments({
        ...filter,
        status: 'REJECTED'
    });

    const cancelledOrders = await Order.countDocuments({
        ...filter,
        status: 'CANCELLED'
    });

    // Revenue calculation
    const revenueStats = await Order.aggregate([
        { $match: { ...filter, status: 'COMPLETED' } },
        { $group: { _id: null, total: { $sum: '$pricing.proposedBudget' } } }
    ]);
    const revenue = revenueStats.length > 0 ? revenueStats[0].total : 0;

    // Fleet utilization (if company admin or super admin)
    let fleetUtilization = 0;
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'COMPANY_ADMIN') {
        const vehicleQuery = req.user.role === 'SUPER_ADMIN' 
            ? (req.query.companyId && mongoose.Types.ObjectId.isValid(req.query.companyId) ? { companyId: new mongoose.Types.ObjectId(req.query.companyId) } : {}) 
            : { companyId };
        const totalVehicles = await Vehicle.countDocuments(vehicleQuery);
        const activeVehicles = await Vehicle.countDocuments({ ...vehicleQuery, status: 'ACTIVE' });
        fleetUtilization = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;
    }

    // Active Clients (Unique shippers who created orders)
    const activeClients = await Order.distinct('createdBy', filter);

    // Delayed Shipments
    const delayedShipments = await Order.countDocuments({
        ...filter,
        deliveryDeadline: { $lt: new Date() },
        status: { $nin: ['DELIVERED', 'COMPLETED', 'CANCELLED'] }
    });

    // 4. Chart Data: Orders by day
    const chartData = await Order.aggregate([
        { $match: filter },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 },
                revenue: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, "$pricing.proposedBudget", 0] } }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    // 6. Carrier Distribution (Group by target company)
    const carrierDistribution = await Order.aggregate([
        { $match: filter },
        {
            $group: {
                _id: '$targetCompanyId',
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'companies',
                localField: '_id',
                foreignField: '_id',
                as: 'company'
            }
        },
        {
            $project: {
                name: { $ifNull: [{ $arrayElemAt: ['$company.companyName', 0] }, 'Independent/Marketplace'] },
                value: '$count'
            }
        }
    ]);

    // 7. Geographic Performance (Group by delivery city)
    const geoPerformance = await Order.aggregate([
        { $match: filter },
        {
            $group: {
                _id: '$deliveryLocation.city',
                value: { $sum: 1 }
            }
        },
        { $sort: { value: -1 } },
        { $limit: 10 },
        {
            $project: {
                name: { $ifNull: ['$_id', 'Unknown'] },
                value: 1
            }
        }
    ]);

    // 8. Recent Orders
    const recentOrders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('createdBy', 'fullName');

    res.status(200).json({
        status: 'success',
        data: {
            stats: {
                totalOrders,
                activeShipments,
                deliveredToday,
                pendingOrders,
                completedOrders,
                rejectedOrders,
                cancelledOrders,
                revenue,
                fleetUtilization,
                activeClients: activeClients.length,
                delayedShipments
            },
            chartData: chartData.map(item => ({
                date: item._id,
                shipments: item.count,
                revenue: item.revenue
            })),
            recentOrders: recentOrders.map(order => ({
                id: order._id,
                orderNumber: order.orderNumber,
                origin: order.pickupLocation.address,
                destination: order.deliveryLocation.address,
                status: order.status.toLowerCase(),
                createdAt: order.createdAt,
                customer: order.createdBy ? order.createdBy.fullName : 'Unknown'
            })),
            carrierDistribution,
            geoPerformance
        }
    });
});

// Overview endpoint used by frontend analytics dashboard
exports.getOverview = catchAsync(async (req, res, next) => {
    const { start, end, companyId: queryCompanyId } = req.query;
    let startDate = start ? new Date(start) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let endDate = end ? new Date(end) : new Date();
    endDate.setHours(23,59,59,999);

    let filter = { createdAt: { $gte: startDate, $lte: endDate } };
    
    if (req.user.role === 'COMPANY_ADMIN') {
        let companyId = req.user.companyId;
        if (!companyId) {
            const company = await Company.findOne({ ownerId: req.user._id });
            if (company) companyId = company._id;
        }
        if (!companyId) return next(new AppError('No company found for this admin', 404));
        const cId = new mongoose.Types.ObjectId(companyId);
        filter.$or = [
            { targetCompanyId: cId },
            { createdBy: req.user._id }
        ];
    } else if (req.user.role === 'VENDOR' || req.user.role === 'SHIPPER') {
        filter.createdBy = req.user._id;
    } else if (req.user.role === 'SUPER_ADMIN' && queryCompanyId && mongoose.Types.ObjectId.isValid(queryCompanyId)) {
        filter.targetCompanyId = new mongoose.Types.ObjectId(queryCompanyId);
    }

    const totalTrips = await Order.countDocuments(filter);
    const delivered = await Order.countDocuments({ ...filter, status: { $in: ['DELIVERED', 'COMPLETED'] } });
    const failed = await Order.countDocuments({ ...filter, status: { $in: ['CANCELLED', 'REJECTED'] } });

    const avgAgg = await Order.aggregate([
        { $match: { ...filter, status: { $in: ['DELIVERED', 'COMPLETED'] } } },
        { $project: { diffMinutes: { $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 60000] } } },
        { $group: { _id: null, avgMinutes: { $avg: '$diffMinutes' } } }
    ]);
    const avgDeliveryTime = avgAgg.length ? Math.round(avgAgg[0].avgMinutes) : null;

    const recentOrders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('createdBy', 'fullName')
        .lean();

    const recent = recentOrders.map(o => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        status: o.status,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        deliveryTimeMinutes: (o.status === 'DELIVERED' || o.status === 'COMPLETED') && o.updatedAt ? Math.round((new Date(o.updatedAt) - new Date(o.createdAt)) / 60000) : null,
        customer: o.createdBy ? o.createdBy.fullName : null
    }));

    res.status(200).json({
        status: 'success',
        data: {
            totalTrips,
            delivered,
            failed,
            avgDeliveryTime,
            recent
        }
    });
});

// Export CSV for analytics
exports.exportOverview = catchAsync(async (req, res, next) => {
    const { start, end, companyId: queryCompanyId } = req.query;
    let startDate = start ? new Date(start) : new Date(0);
    let endDate = end ? new Date(end) : new Date();
    endDate.setHours(23,59,59,999);

    let filter = { createdAt: { $gte: startDate, $lte: endDate } };
    
    if (req.user.role === 'COMPANY_ADMIN') {
        let companyId = req.user.companyId;
        if (!companyId) {
            const company = await Company.findOne({ ownerId: req.user._id });
            if (company) companyId = company._id;
        }
        if (!companyId) return next(new AppError('No company found for this admin', 404));
        const cId = new mongoose.Types.ObjectId(companyId);
        filter.$or = [
            { targetCompanyId: cId },
            { createdBy: req.user._id }
        ];
    } else if (req.user.role === 'VENDOR' || req.user.role === 'SHIPPER') {
        filter.createdBy = req.user._id;
    } else if (req.user.role === 'SUPER_ADMIN' && queryCompanyId && mongoose.Types.ObjectId.isValid(queryCompanyId)) {
        filter.targetCompanyId = new mongoose.Types.ObjectId(queryCompanyId);
    }

    const orders = await Order.find(filter).populate('createdBy', 'fullName').lean();

    const headers = [
        'orderNumber', 'status', 'createdAt', 'updatedAt', 'deliveryTimeMinutes', 'customer', 'targetCompanyId'
    ];

    const rows = orders.map(o => {
        const deliveryTime = (o.status === 'DELIVERED' || o.status === 'COMPLETED') && o.updatedAt ? Math.round((new Date(o.updatedAt) - new Date(o.createdAt)) / 60000) : '';
        return [
            o.orderNumber || '',
            o.status || '',
            o.createdAt ? new Date(o.createdAt).toISOString() : '',
            o.updatedAt ? new Date(o.updatedAt).toISOString() : '',
            deliveryTime,
            o.createdBy ? o.createdBy.fullName : '',
            o.targetCompanyId ? String(o.targetCompanyId) : ''
        ].map(v => (v === null || v === undefined) ? '' : String(v).replace(/\r?\n|\r/g, ' '));
    });

    const csvLines = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${startDate.toISOString().slice(0,10)}-${endDate.toISOString().slice(0,10)}.csv"`);
    res.status(200).send(csvLines);
});
