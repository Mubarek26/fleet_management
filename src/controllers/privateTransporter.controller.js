const PrivateTransporterApplication = require('../database/models/privateTransporterApplication.model');
const Driver = require('../database/models/driver.model');
const Vehicle = require('../database/models/vehicle.model');
const { sendSMS } = require('../services/afromessage.service');

// POST /api/private-transporter/apply
exports.apply = async (req, res) => {
  try {
    const {
      fullName,
      contactNumber,
      email,
      address,
      vehicleType,
      vehicleRegistrationNumber,
      driversLicenseNumber,
      licenseExpiryDate,
      nationalIdOrPassport,
      yearsOfExperience,
      availability,
      notes
    } = req.body;

    // Get userId from authenticated user
    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Prevent multiple applications by the same user
    const existing = await PrivateTransporterApplication.findOne({ userId });
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted an application.' });
    }

    // Handle file uploads if using multer or similar middleware
    const uploads = {
      driversLicenseImage: req.files?.driversLicenseImage?.[0]?.path || '',
      vehicleRegistrationImage: req.files?.vehicleRegistrationImage?.[0]?.path || '',
      profilePhoto: req.files?.profilePhoto?.[0]?.path || '',
      nationalIdOrPassportImage: req.files?.nationalIdOrPassportImage?.[0]?.path || ''
    };

    const application = new PrivateTransporterApplication({
      userId,
      fullName,
      contactNumber,
      email,
      address,
      vehicleType,
      vehicleRegistrationNumber,
      driversLicenseNumber,
      licenseExpiryDate,
      nationalIdOrPassport,
      uploads,
      yearsOfExperience,
      availability,
      notes
    });

    // Vehicle details from request body
    const vehicleDetails = {
      plateNumber: req.body.vehicleRegistrationNumber,
      vehicleType: req.body.vehicleType,
      model: req.body.vehicleModel,
      capacityKg: req.body.vehicleCapacityKg
    };
    // Store vehicle details in application for later use
    application.vehicleDetails = vehicleDetails;

    await application.save();
    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit application', error: error.message });
  }
};

// GET /api/private-transporter/my-application
exports.getMyApplication = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const application = await PrivateTransporterApplication.findOne({ userId });
    if (!application) {
      return res.status(404).json({ message: 'No application found for this user.' });
    }
    res.status(200).json({ application });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch application', error: error.message });
  }
};

// GET /api/private-transporter/:id (admin/review)
exports.getApplicationById = async (req, res) => {
  try {
    const application = await PrivateTransporterApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    res.status(200).json({ application });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch application', error: error.message });
  }
};

// GET /api/private-transporter (admin only)
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await PrivateTransporterApplication.find();
    res.status(200).json({ applications });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch applications', error: error.message });
  }
};

// PATCH /api/private-transporter/:id/status (admin only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body; // expected: 'approved' or 'rejected'
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }
    const application = await PrivateTransporterApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    // Send SMS if approved
    if (status === 'approved' && application.contactNumber) {
      try {
        await sendSMS({
          to: application.contactNumber,
          message: `Your application has been approved. Welcome to the platform!`
          
        });
      } catch (smsErr) {
        console.error('Failed to send approval SMS:', smsErr.message);
      }
    }
    res.status(200).json({ message: 'Status updated.', application });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
};

// DELETE /api/private-transporter/my-application (user can withdraw)
exports.deleteMyApplication = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
      }
      
    const deleted = await PrivateTransporterApplication.findOneAndDelete({ userId });
    if (!deleted) {
      return res.status(404).json({ message: 'No application found to delete.' });
    }
    res.status(200).json({ message: 'Application withdrawn successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to withdraw application', error: error.message });
  }
};

// POST /api/private-transporter/:id/assign-company (admin only)
exports.assignToCompany = async (req, res) => {
  try {
    const { companyId } = req.body;
    const applicationId = req.params.id;
    if (!companyId) {
      return res.status(400).json({ message: 'companyId is required.' });
    }
    // Find the application
    const application = await PrivateTransporterApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    // Check if already assigned as driver
    const existingDriver = await Driver.findOne({ userId: application.userId });
    if (existingDriver) {
      return res.status(400).json({ message: 'This user is already a driver.' });
    }
    // Create driver from application
    const driver = await Driver.create({
      userId: application.userId,
      companyId,
      fullName: application.fullName,
      phoneNumber: application.contactNumber,
      email: application.email,
      licenseNumber: application.driversLicenseNumber,
      licensePhoto: application.uploads?.driversLicenseImage,
      driverPhoto: application.uploads?.profilePhoto,
      status: 'ACTIVE',
      active: true
    });
    // Create vehicle for this driver
    let vehicle;
    if (application.vehicleDetails && application.vehicleDetails.plateNumber) {
      vehicle = await Vehicle.create({
        companyId,
        plateNumber: application.vehicleDetails.plateNumber,
        vehicleType: application.vehicleDetails.vehicleType,
        model: application.vehicleDetails.model,
        capacityKg: application.vehicleDetails.capacityKg,
        status: 'ACTIVE',
        active: true,
        currentDriverId: driver._id
      });
      // Optionally, update driver with currentVehicleId
      driver.currentVehicleId = vehicle._id;
      await driver.save();
    }
    // Optionally update application status
    application.status = 'approved';
    await application.save();
    res.status(201).json({ message: 'Driver assigned to company successfully.', driver });
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign driver', error: error.message });
  }
};
