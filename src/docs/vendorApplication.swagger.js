/**
 * @swagger
 * tags:
 *   name: VendorApplication
 *   description: Vendor application management
 */

/**
 * @swagger
 * /api/v1/vendor/apply:
 *   post:
 *     summary: Submit a new vendor application
 *     tags: [VendorApplication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               companyName:
 *                 type: string
 *               contactName:
 *                 type: string
 *               contactNumber:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               businessType:
 *                 type: string
 *               businessRegistrationNumber:
 *                 type: string
 *               taxIdNumber:
 *                 type: string
 *               yearsInBusiness:
 *                 type: integer
 *               website:
 *                 type: string
 *               expectedMonthlyOrders:
 *                 type: integer
 *               notes:
 *                 type: string
 *               businessLicenseImage:
 *                 type: string
 *                 format: binary
 *               taxIdImage:
 *                 type: string
 *                 format: binary
 *               companyProfileImage:
 *                 type: string
 *                 format: binary
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
 * /api/v1/vendor/my-application:
 *   get:
 *     summary: Get your own vendor application
 *     tags: [VendorApplication]
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
 *     summary: Delete (withdraw) your own vendor application
 *     tags: [VendorApplication]
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
 * /api/v1/vendor/{id}:
 *   get:
 *     summary: Get vendor application by ID (admin only)
 *     tags: [VendorApplication]
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
 * /api/v1/vendor:
 *   get:
 *     summary: List all vendor applications (admin only)
 *     tags: [VendorApplication]
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
 * /api/v1/vendor/{id}/status:
 *   patch:
 *     summary: Update vendor application status (admin only)
 *     tags: [VendorApplication]
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
