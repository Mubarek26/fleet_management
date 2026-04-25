const VendorApplication = require('../database/models/vendorApplication.model');
const { uploadMulterFile } = require('../utils/cloudinaryUpload');

// POST /api/v1/vendor/apply
exports.apply = async (req, res) => {
  try {
    const {
      companyName,
      contactName,
      contactNumber,
      email,
      address,
      businessType,
      businessRegistrationNumber,
      taxIdNumber,
      yearsInBusiness,
      website,
      expectedMonthlyOrders,
      notes
    } = req.body;

    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const existing = await VendorApplication.findOne({ userId });
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted an application.' });
    }

    const [businessLicenseUpload, taxIdUpload, companyProfileUpload] = await Promise.all([
      uploadMulterFile(req.files?.businessLicenseImage?.[0], { folder: 'vendor-applications' }),
      uploadMulterFile(req.files?.taxIdImage?.[0], { folder: 'vendor-applications' }),
      uploadMulterFile(req.files?.companyProfileImage?.[0], { folder: 'vendor-applications' })
    ]);

    const uploads = {
      businessLicenseImage: businessLicenseUpload?.secure_url || '',
      taxIdImage: taxIdUpload?.secure_url || '',
      companyProfileImage: companyProfileUpload?.secure_url || ''
    };

    const application = new VendorApplication({
      userId,
      companyName,
      contactName,
      contactNumber,
      email,
      address,
      businessType,
      businessRegistrationNumber,
      taxIdNumber,
      yearsInBusiness,
      website,
      expectedMonthlyOrders,
      notes,
      uploads
    });

    await application.save();
    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit application', error: error.message });
  }
};

// GET /api/v1/vendor/my-application
exports.getMyApplication = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const application = await VendorApplication.findOne({ userId });
    if (!application) {
      return res.status(404).json({ message: 'No application found for this user.' });
    }

    res.status(200).json({ application });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch application', error: error.message });
  }
};

// GET /api/v1/vendor/:id (admin only)
exports.getApplicationById = async (req, res) => {
  try {
    const application = await VendorApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    res.status(200).json({ application });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch application', error: error.message });
  }
};

// GET /api/v1/vendor (admin only)
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await VendorApplication.find();
    res.status(200).json({ applications });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch applications', error: error.message });
  }
};

// PATCH /api/v1/vendor/:id/status (admin only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const application = await VendorApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    // Automatically set User status to ACTIVE if application is approved
    if (status === 'approved') {
      const User = require('../database/models/user.model');
      await User.findByIdAndUpdate(application.userId, { status: 'ACTIVE' });
    }

    res.status(200).json({ message: 'Status updated.', application });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
};

// DELETE /api/v1/vendor/my-application
exports.deleteMyApplication = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const deleted = await VendorApplication.findOneAndDelete({ userId });
    if (!deleted) {
      return res.status(404).json({ message: 'No application found to delete.' });
    }

    res.status(200).json({ message: 'Application withdrawn successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to withdraw application', error: error.message });
  }
};
