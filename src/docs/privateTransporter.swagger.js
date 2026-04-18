/**
 * @swagger
 * tags:
 *   name: PrivateTransporter
 *   description: Private Transporter Application management
 */

/**
 * @swagger
 * /api/v1/private-transporter/apply:
 *   post:
 *     summary: Submit a new private transporter application
 *     tags: [PrivateTransporter]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               contactNumber:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               vehicleType:
 *                 type: string
 *               vehicleRegistrationNumber:
 *                 type: string
 *               driversLicenseNumber:
 *                 type: string
 *               licenseExpiryDate:
 *                 type: string
 *                 format: date
 *               nationalIdOrPassport:
 *                 type: string
 *               yearsOfExperience:
 *                 type: integer
 *               availability:
 *                 type: string
 *                 enum: [full-time, part-time]
 *               notes:
 *                 type: string
 *               driversLicenseImage:
 *                 type: string
 *                 format: binary
 *               vehicleRegistrationImage:
 *                 type: string
 *                 format: binary
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *               nationalIdOrPassportImage:
 *                 type: string
 *                 format: binary
 *               vehicleModel:
 *                 type: string
 *               vehicleCapacityKg:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *       400:
 *         description: Duplicate application or validation error
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/private-transporter/my-application:
 *   get:
 *     summary: Get your own application
 *     tags: [PrivateTransporter]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Application found
 *       404:
 *         description: No application found
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete (withdraw) your own application
 *     tags: [PrivateTransporter]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Application withdrawn successfully
 *       404:
 *         description: No application found to delete
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/private-transporter/{id}:
 *   get:
 *     summary: Get application by ID (admin only)
 *     tags: [PrivateTransporter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application found
 *       404:
 *         description: Application not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/private-transporter:
 *   get:
 *     summary: List all applications (admin only)
 *     tags: [PrivateTransporter]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of applications
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/private-transporter/{id}/status:
 *   patch:
 *     summary: Update application status (admin only)
 *     tags: [PrivateTransporter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Application not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/private-transporter/{id}/assign-company:
 *   post:
 *     summary: Assign a private transporter/driver to a company (admin only)
 *     tags: [PrivateTransporter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyId:
 *                 type: string
 *                 description: The company ObjectId to assign the driver to
 *     responses:
 *       201:
 *         description: Driver and vehicle created and assigned to company
 *       400:
 *         description: Validation error or already a driver
 *       404:
 *         description: Application not found
 *       401:
 *         description: Unauthorized
 */
