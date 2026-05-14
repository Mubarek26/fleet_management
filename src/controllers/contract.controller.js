const Contract = require('../database/models/contract.model');
const Company = require('../database/models/company.model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Order = require('../database/models/order.model');
const User = require('../database/models/user.model');

exports.initiateContract = catchAsync(async (req, res, next) => {
	if (!req.user?._id) {
		return next(new AppError('You must be logged in to initiate a contract request', 401));
	}

	if (!['VENDOR', 'COMPANY_ADMIN'].includes(req.user.role)) {
		return next(new AppError('Only vendors or companies can initiate partnership requests', 403));
	}

	const { transporterCompanyId, vendorId, message, startDate, endDate } = req.body;

	let finalTransporterCompanyId = transporterCompanyId;
	let finalVendorId = vendorId;

	if (req.user.role === 'VENDOR') {
		finalVendorId = req.user._id;
		if (!finalTransporterCompanyId) return next(new AppError('transporterCompanyId is required for vendors', 400));
	} else {
		// Company Admin initiating
		let managedCompanyId = req.user.companyId;
		if (!managedCompanyId) {
			const ownedCompany = await Company.findOne({ ownerId: req.user._id }).select('_id');
			managedCompanyId = ownedCompany?._id;
		}
		if (!managedCompanyId) return next(new AppError('No company found for this user', 400));
		finalTransporterCompanyId = managedCompanyId;
		if (!finalVendorId) return next(new AppError('vendorId is required for companies', 400));
	}

	if (!finalTransporterCompanyId) {
		return next(new AppError('No associated company found for this request. Please ensure your account is linked to a company.', 400));
	}

	if (!finalVendorId) {
		return next(new AppError('No vendor specified for this partnership request.', 400));
	}

	if (!startDate || !endDate) {
		return next(new AppError('startDate and endDate are required', 400));
	}

	const parsedStartDate = new Date(startDate);
	const parsedEndDate = new Date(endDate);

	if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
		return next(new AppError('startDate and endDate must be valid dates', 400));
	}

	if (parsedEndDate < parsedStartDate) {
		return next(new AppError('endDate must be greater than or equal to startDate', 400));
	}

	const company = await Company.findById(finalTransporterCompanyId);
	if (!company) {
		return next(new AppError(`Company with ID ${finalTransporterCompanyId} not found`, 404));
	}
	if (!company.active || company.status !== 'APPROVED') {
		return next(new AppError(`Company "${company.companyName}" is not active or not approved for partnerships`, 400));
	}

	const vendor = await User.findById(finalVendorId);
	if (!vendor) {
		return next(new AppError(`Vendor with ID ${finalVendorId} not found`, 404));
	}
	if (vendor.role !== 'VENDOR' || !vendor.active) {
		return next(new AppError(`User "${vendor.fullName}" is not an active vendor`, 400));
	}

	const existingContract = await Contract.findOne({
		vendorId: finalVendorId,
		transporterCompanyId: finalTransporterCompanyId,
		status: { $in: ['PENDING', 'ACCEPTED'] },
	});

	if (existingContract) {
		return next(
			new AppError(
				`A ${existingContract.status.toLowerCase()} partnership request already exists with this transporter company`,
				409
			)
		);
	}

	const contract = await Contract.create({
		vendorId: finalVendorId,
		transporterCompanyId: finalTransporterCompanyId,
		startDate: parsedStartDate,
		endDate: parsedEndDate,
		message,
		initiatedBy: req.user.role
	});

	await contract.populate([
		{ path: 'vendorId', select: 'fullName email phoneNumber role' },
		{ path: 'transporterCompanyId', select: 'companyName email phoneNumber status ownerId' },
	]);

	res.status(201).json({
		status: 'success',
		message: 'Partnership request sent successfully',
		data: {
			contract,
		},
	});
});

exports.approveContract = catchAsync(async (req, res, next) => {
	if (!req.user?._id) {
		return next(new AppError('You must be logged in to approve a contract request', 401));
	}

	if (!['VENDOR', 'COMPANY_ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
		return next(new AppError('You are not allowed to approve partnership requests', 403));
	}

	const contract = await Contract.findById(req.params.id);
	if (!contract) {
		return next(new AppError('No contract request found with that ID', 404));
	}

	if (contract.status !== 'PENDING') {
		return next(new AppError(`This contract request is already ${contract.status.toLowerCase()}`, 400));
	}

	if (req.user.role !== 'SUPER_ADMIN') {
		// If initiated by VENDOR, only the targeted COMPANY_ADMIN can approve
		if (contract.initiatedBy === 'VENDOR' || !contract.initiatedBy) { // fallback for old contracts
			if (req.user.role !== 'COMPANY_ADMIN') {
				return next(new AppError('Only company admins can approve this request', 403));
			}
			let managedCompanyId = req.user.companyId;
			if (!managedCompanyId) {
				const ownedCompany = await Company.findOne({ ownerId: req.user._id }).select('_id');
				managedCompanyId = ownedCompany?._id;
			}
			if (!managedCompanyId || managedCompanyId.toString() !== contract.transporterCompanyId.toString()) {
				return next(new AppError('You are not allowed to approve requests for this company', 403));
			}
		} 
		// If initiated by COMPANY_ADMIN, only the targeted VENDOR can approve
		else if (contract.initiatedBy === 'COMPANY_ADMIN') {
			if (req.user.role !== 'VENDOR') {
				return next(new AppError('Only the targeted vendor can approve this request', 403));
			}
			if (req.user._id.toString() !== contract.vendorId.toString()) {
				return next(new AppError('You are not the targeted vendor for this request', 403));
			}
		}
	}

	contract.status = 'ACCEPTED';
	await contract.save();

	await contract.populate([
		{ path: 'vendorId', select: 'fullName email phoneNumber role' },
		{ path: 'transporterCompanyId', select: 'companyName email phoneNumber status ownerId' },
	]);

	res.status(200).json({
		status: 'success',
		message: 'Partnership request approved successfully',
		data: {
			contract,
		},
	});
});

exports.getVendorContracts = catchAsync(async (req, res, next) => {
	if (!req.user?._id) {
		return next(new AppError('You must be logged in to view vendor contracts', 401));
	}

	if (req.user.role !== 'VENDOR') {
		return next(new AppError('Only vendors can view their contract requests', 403));
	}

	const filter = { vendorId: req.user._id };

	if (req.query.status) {
		filter.status = req.query.status.toUpperCase();
	}

	const contracts = await Contract.find(filter)
		.populate({
			path: 'transporterCompanyId',
			select: 'companyName email phoneNumber status ownerId active',
		})
		.populate({
			path: 'vendorId',
			select: 'fullName email phoneNumber role status',
		})
		.sort({ createdAt: -1 });

	res.status(200).json({
		status: 'success',
		results: contracts.length,
		data: {
			contracts,
		},
	});
});

exports.getCompanyContracts = catchAsync(async (req, res, next) => {
	if (!req.user?._id) {
		return next(new AppError('You must be logged in to view company contracts', 401));
	}

	if (!['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
		return next(new AppError('Only company admins can view incoming partnership requests', 403));
	}

	let companyId = req.user.companyId;

	if (!companyId) {
		const ownedCompany = await Company.findOne({ ownerId: req.user._id }).select('_id');
		companyId = ownedCompany?._id;
	}

	if (!companyId && req.user.role !== 'COMPANY_ADMIN') {
		return next(new AppError('Authenticated user is not linked to a company', 400));
	}

	const filter = {};

	if (req.user.role !== 'COMPANY_ADMIN') {
		filter.transporterCompanyId = companyId;
	} else if (req.query.companyId) {
		filter.transporterCompanyId = req.query.companyId;
	}

	if (req.query.status) {
		filter.status = req.query.status.toUpperCase();
	}

	const contracts = await Contract.find(filter)
		.populate({
			path: 'transporterCompanyId',
			select: 'companyName email phoneNumber status ownerId active',
		})
		.populate({
			path: 'vendorId',
			select: 'fullName email phoneNumber role status',
		})
		.sort({ createdAt: -1 });

	res.status(200).json({
		status: 'success',
		results: contracts.length,
		data: {
			contracts,
		},
	});
});

exports.terminateContract = catchAsync(async (req, res, next) => {
	if (!req.user?._id) {
		return next(new AppError('You must be logged in to terminate a contract', 401));
	}

	if (!['VENDOR', 'COMPANY_ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
		return next(new AppError('You are not allowed to terminate contracts', 403));
	}

	const contract = await Contract.findById(req.params.id);
	if (!contract) {
		return next(new AppError('No contract found with that ID', 404));
	}

	if (['TERMINATED', 'CANCELLED', 'REJECTED'].includes(contract.status)) {
		return next(new AppError(`This contract is already ${contract.status.toLowerCase()}`, 400));
	}

	let canTerminate = req.user.role === 'SUPER_ADMIN' || contract.vendorId.toString() === req.user._id.toString();

	if (!canTerminate && req.user.role === 'COMPANY_ADMIN') {
		let managedCompanyId = req.user.companyId;

		if (!managedCompanyId) {
			const ownedCompany = await Company.findOne({ ownerId: req.user._id }).select('_id');
			managedCompanyId = ownedCompany?._id;
		}

		canTerminate =
			!!managedCompanyId && managedCompanyId.toString() === contract.transporterCompanyId.toString();
	}

	if (!canTerminate) {
		return next(new AppError('You are not allowed to terminate this contract', 403));
	}

	contract.status = 'TERMINATED';
	contract.endDate = new Date();
	await contract.save();

	await contract.populate([
		{ path: 'vendorId', select: 'fullName email phoneNumber role status' },
		{ path: 'transporterCompanyId', select: 'companyName email phoneNumber status ownerId active' },
	]);

	res.status(200).json({
		status: 'success',
		message: 'Contract terminated successfully',
		data: {
			contract,
		},
	});
});
