/**
 * @swagger
 * tags:
 *   - name: Driver
 *     description: Driver status, assignments, and vehicle assignment endpoints
 */

/**
 * @swagger
 * /api/v1/driver/status:
 *   patch:
 *     summary: Update logged-in driver status and availability
 *     description: Allows an authenticated driver/company admin/super admin to update the linked driver status and optional user availability.
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, ACTIVE, SUSPENDED, OFFLINE]
 *               isAvailable:
 *                 type: boolean
 *             additionalProperties: false
 *     responses:
 *       200:
 *         description: Driver status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Driver status updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     driver:
 *                       $ref: '#/components/schemas/Driver'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Driver profile not found
 */

/**
 * @swagger
 * /api/v1/driver/assignments:
 *   get:
 *     summary: Get current driver assignments
 *     description: Returns assigned/in-transit/delivered orders for the logged-in driver account.
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Optional order status filter
 *     responses:
 *       200:
 *         description: Driver assignments fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: object
 *                   properties:
 *                     assignments:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/v1/driver/vehicles/assign:
 *   post:
 *     summary: Assign a vehicle to a driver
 *     description: Allows COMPANY_ADMIN or SUPER_ADMIN to bind a driver to a vehicle in the same company.
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driverId
 *               - vehicleId
 *             properties:
 *               driverId:
 *                 type: string
 *                 description: Driver id
 *               vehicleId:
 *                 type: string
 *                 description: Vehicle id
 *             additionalProperties: false
 *     responses:
 *       200:
 *         description: Driver assigned to vehicle successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Driver assigned to vehicle successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     driver:
 *                       $ref: '#/components/schemas/Driver'
 *                     vehicle:
 *                       $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Driver or vehicle not found
 *       409:
 *         description: Driver or vehicle is already assigned
 */

/**
 * @swagger
 * /api/v1/driver/vehicles/unassign:
 *   post:
 *     summary: Unassign a driver from current vehicle
 *     description: Allows COMPANY_ADMIN or SUPER_ADMIN to detach a driver from the currently assigned vehicle.
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driverId
 *             properties:
 *               driverId:
 *                 type: string
 *                 description: Driver id
 *               vehicleId:
 *                 type: string
 *                 description: Optional current vehicle id confirmation
 *             additionalProperties: false
 *     responses:
 *       200:
 *         description: Driver unassigned from vehicle successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Driver unassigned from vehicle successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     driver:
 *                       $ref: '#/components/schemas/Driver'
 *                     vehicle:
 *                       $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Driver not found
 */

/**
 * @swagger
 * /api/v1/driver/vehicles/reassign:
 *   post:
 *     summary: Reassign a driver to another vehicle
 *     description: Allows COMPANY_ADMIN or SUPER_ADMIN to move a driver from current vehicle to another active vehicle in the same company.
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driverId
 *               - vehicleId
 *             properties:
 *               driverId:
 *                 type: string
 *                 description: Driver id
 *               vehicleId:
 *                 type: string
 *                 description: Target vehicle id
 *             additionalProperties: false
 *     responses:
 *       200:
 *         description: Driver reassigned to vehicle successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Driver reassigned to vehicle successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     driver:
 *                       $ref: '#/components/schemas/Driver'
 *                     vehicle:
 *                       $ref: '#/components/schemas/Vehicle'
 *                     previousVehicle:
 *                       $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Driver or vehicle not found
 *       409:
 *         description: Vehicle already assigned to another driver
 */
