const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
// const fs = require('fs');
const userControllers = require("./../controllers/user.controller");
const uploads = require("../middleware/uploads.middleware");
const { createUser, getAllUsers, getUser, updateUsers, deleteUsers } =
  userControllers;
const { signup, login } = authController;
// const app = express();


router.route("/login").post(login);
router.route("/logout").get(authController.logout); // Route to log out user
router.route("/forgotPassword").post(authController.forgotPassword);
router.route("/resetPassword/:token").patch(authController.resetPassword);
router.route("/signup").post(uploads.single("photo"), signup); 

// router.use(authController.protect); // Protect all routes after this middleware

router.route("/updatePassword").patch(authController.protect, authController.updatePassword);
router.route("/me").get(authController.protect, userControllers.getMe, userControllers.getUser); // Route to create a new user
router
  .route("/updateMe")
  .patch(authController.protect, uploads.single("photo"), userControllers.updateMe); // Route to update user profile
router.route("/deleteMe").delete(authController.protect, userControllers.deleteMe); // Route to delete user profile



// Restrict all routes after this middleware to admin users
// router.use(authController.restrictTo("super admin"));


router.route("/").get(authController.protect, getAllUsers);

router.get('/check-auth', authController.protect, (req, res) => {
  res.json({ status: 'ok', user: req.user });
});


router.route("/:id").get(authController.protect, getUser).patch(authController.protect, updateUsers).delete(authController.protect, deleteUsers);

module.exports = router;
