const Contract = require('../database/models/contract.model');
const Company = require('../database/models/company.model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.initiateContract = catchAsync(async (req, res, next) => {
	if (!req.user?._id) {
		return next(new AppError('You must be logged in to initiate a contract request', 401));
	}

	if (req.user.role !== 'VENDOR') {
		return next(new AppError('Only vendors can initiate partnership requests', 403));
	}

	const { transporterCompanyId, message, startDate, endDate } = req.body;

	if (!transporterCompanyId) {
		return next(new AppError('transporterCompanyId is required', 400));
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

	const company = await Company.findById(transporterCompanyId);
	if (!company || !company.active || company.status !== 'ACTIVE') {
		return next(new AppError('No active transporter company found with that ID', 404));
	}

	const existingContract = await Contract.findOne({
		vendorId: req.user._id,
		transporterCompanyId,
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
		vendorId: req.user._id,
		transporterCompanyId,
		startDate: parsedStartDate,
		endDate: parsedEndDate,
		message,
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

	if (!['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
		return next(new AppError('Only company admins can approve partnership requests', 403));
	}

	const contract = await Contract.findById(req.params.id);
	if (!contract) {
		return next(new AppError('No contract request found with that ID', 404));
	}

	if (contract.status !== 'PENDING') {
		return next(new AppError(`This contract request is already ${contract.status.toLowerCase()}`, 400));
	}

	if (req.user.role !== 'COMPANY_ADMIN') {
		let managedCompanyId = req.user.companyId;

		if (!managedCompanyId) {
			const ownedCompany = await Company.findOne({ ownerId: req.user._id }).select('_id');
			managedCompanyId = ownedCompany?._id;
		}

		if (!managedCompanyId || managedCompanyId.toString() !== contract.transporterCompanyId.toString()) {
			return next(new AppError('You are not allowed to approve requests for this company', 403));
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
