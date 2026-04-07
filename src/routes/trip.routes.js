const express = require('express');
const authController = require('../controllers/auth.controller');
const requireActiveStatus = require('../middleware/requireActiveStatus.middleware');
const tripController = require('../controllers/trip.controller');
const router = express.Router();

router.use(authController.protect);
router.use(requireActiveStatus);

// PATCH /api/driver/trips/:id/milestone
router.patch('/driver/trips/:id/milestone', tripController.updateMilestone);

module.exports = router;
