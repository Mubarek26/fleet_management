const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
// const fs = require('fs');
const userControllers = require("./../controllers/user.controller");
const uploads = require("../middleware/uploads.middleware");
const requireActiveStatus = require("../middleware/requireActiveStatus.middleware");
const { createUser, getAllUsers, getUser, updateUsers, deleteUsers } =
  userControllers;
const { signup, login } = authController;
// const app = express();

router.route("/login").post(login);
router.route("/logout").get(authController.logout); // Route to log out user
router.route("/forgotPassword").post(authController.forgotPassword);
router.route("/resetPassword/:token").patch(authController.resetPassword);
router.route("/signup").post(signup); 
router.route("/verify-email/:token").get(authController.verifyEmail);

// router.use(authController.protect); // Protect all routes after this middleware

router.route("/updatePassword").patch(authController.protect, authController.updatePassword);
router.route("/me").get(authController.protect, userControllers.getMe, userControllers.getUser); // Route to create a new user
router
  .route("/updateMe")
  .patch(authController.protect, uploads.single("photo"), userControllers.updateMe); // Route to update user profile
router.route("/deleteMe").delete(authController.protect, userControllers.deleteMe); // Route to delete user profile



// Restrict all routes after this middleware to admin users
// router.use(authController.restrictTo("super admin"));


const { requirePermissions } = require('../middleware/authorize.middleware');

router.route("/").get(authController.protect, requirePermissions('users:list'), getAllUsers);

router.get('/check-auth', authController.protect, async (req, res) => {
  const user = req.user.toObject ? req.user.toObject() : req.user;
  
  // If the user is a DRIVER, lookup their driver profile to get isPrivateTransporter flag
  if (String(user.role || '').toUpperCase() === 'DRIVER') {
    const Driver = require('../database/models/driver.model');
    const driverProfile = await Driver.findOne({ 
      $or: [
        { userId: user._id },
        { email: user.email },
        { phoneNumber: user.phoneNumber }
      ]
    }).select('isPrivateTransporter');
    
    if (driverProfile) {
      user.isPrivateTransporter = !!driverProfile.isPrivateTransporter;
    }
  }

  res.json({ status: 'ok', user });
});



router.route("/:id").get(authController.protect, requirePermissions('users:read'), getUser).patch(authController.protect, requirePermissions('users:update'), updateUsers).delete(authController.protect, requirePermissions('users:delete'), deleteUsers);

module.exports = router;
