/**
 * @swagger
 * /api/v1/driver/trips/{id}/evidence:
 *   post:
 *     summary: Upload proof of delivery (photo, signature, note)
 *     description: Allows a driver to upload delivery evidence for a trip. Accepts multipart/form-data with a file and/or note.
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [photo, signature, note]
 *                 description: Type of evidence
 *               note:
 *                 type: string
 *                 description: Optional note
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image or signature file
 *     responses:
 *       200:
 *         description: Proof of delivery uploaded
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Trip not found
 */

/**
 * @swagger
 * /api/v1/driver/trips/{id}/verify-otp:
 *   post:
 *     summary: Verify delivery OTP
 *     description: Allows a driver to verify the OTP provided by the recipient to complete delivery.
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 description: The OTP code provided by the recipient
 *     responses:
 *       200:
 *         description: OTP verified, delivery completed
 *       400:
 *         description: Invalid or expired OTP
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Trip not found or no OTP set
 */
/**
 * @swagger
 * /api/driver/location:
 *   post:
 *     summary: Stream driver GPS location
 *     description: Update and stream the driver’s current GPS location for a trip. Emits real-time updates via WebSocket.
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
 *               - tripId
 *               - latitude
 *               - longitude
 *             properties:
 *               tripId:
 *                 type: string
 *                 description: The trip ID
 *               latitude:
 *                 type: number
 *                 description: Latitude
 *               longitude:
 *                 type: number
 *                 description: Longitude
 *               speed:
 *                 type: number
 *                 description: (Optional) Speed in km/h
 *               heading:
 *                 type: number
 *                 description: (Optional) Heading in degrees
 *     responses:
 *       200:
 *         description: Location updated
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
 *                   example: Location updated
 *                 data:
 *                   type: object
 *                   properties:
 *                     tripId:
 *                       type: string
 *                     latitude:
 *                       type: number
 *                     longitude:
 *                       type: number
 *                     speed:
 *                       type: number
 *                     heading:
 *                       type: number
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (trip does not belong to driver)
 *       404:
 *         description: Trip not found
 */
/**
 * @swagger
 * /api/v1/driver/assignments/{orderId}/accept:
 *   patch:
 *     summary: Driver accepts assigned order
 *     description: Allows a driver to accept an order that is in ASSIGNED state.
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID to accept
 *     responses:
 *       200:
 *         description: Order accepted successfully
 *       400:
 *         description: Order is not in ASSIGNED state
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
/**
 * @swagger
 * /api/v1/driver/assignments/{orderId}/reject:
 *   patch:
 *     summary: Driver rejects assigned order
 *     description: Allows a driver to reject an order that is in ASSIGNED state.
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID to reject
 *     responses:
 *       200:
 *         description: Order rejected successfully
 *       400:
 *         description: Order is not in ASSIGNED state
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
/**
 * @swagger
 * /api/v1/driver/assignments/{orderId}/start:
 *   patch:
 *     summary: Driver starts order assignment
 *     description: Allows a driver to start an order that is in ACCEPTED or ASSIGNED state.
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID to start
 *     responses:
 *       200:
 *         description: Order started successfully
 *       400:
 *         description: Order must be accepted or assigned to start
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
/**
 * @swagger
 * /api/v1/driver/assignments/{orderId}/arrive:
 *   patch:
 *     summary: Driver marks arrival at pickup
 *     description: Allows a driver to mark arrival at pickup for an order in IN_TRANSIT state.
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID to mark as arrived
 *     responses:
 *       200:
 *         description: Arrival marked successfully
 *       400:
 *         description: Order must be IN_TRANSIT to arrive at pickup
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
/**
 * @swagger
 * /api/v1/driver/assignments/{orderId}/complete:
 *   patch:
 *     summary: Driver completes order assignment
 *     description: Allows a driver to complete an order that is in ARRIVED state.
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID to complete
 *     responses:
 *       200:
 *         description: Order completed successfully
 *       400:
 *         description: Order must be ARRIVED to complete
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
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
