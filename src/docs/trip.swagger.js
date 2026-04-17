/**
 * @swagger
 * /api/v1/trips/{id}:
 *   get:
 *     summary: Get trip details
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trip ID
 *     responses:
 *       200:
 *         description: Trip details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     trip:
 *                       $ref: '#/components/schemas/Trip'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Trip not found
 */

/**
 * @swagger
 * /api/v1/trips:
 *   get:
 *     summary: List all trips
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of trips
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     trips:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Trip'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/trips:
 *   post:
 *     summary: Create a trip
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: |
 *         Fields used when creating a trip. Required: `location` (GeoJSON Point) and `driverId` (ObjectId) per the Trip model. Optional: `orderId`, `geofences`, `vehicleId`. Do NOT send `locationHistory` — the server derives it from `location`.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Trip'
 *           example:
 *             orderId: "647f1f3e1c4a3b2f8c9d0e1a"
 *             geofences:
 *               - "647f1f3e1c4a3b2f8c9d0e2b"
 *             driverId: "647f1f3e1c4a3b2f8c9d0e1b"
 *             vehicleId: "647f1f3e1c4a3b2f8c9d0e1c"
 *             location:
 *               type: "Point"
 *               coordinates: [3.3792, 6.5244]
 *     responses:
 *       201:
 *         description: Trip created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     trip:
 *                       $ref: '#/components/schemas/Trip'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/trips/{id}:
 *   patch:
 *     summary: Update a trip
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trip ID
 *     requestBody:
 *       description: |
 *         Allowed fields when updating a trip. If `location` (GeoJSON Point) is provided, the server will update `location` and append to `locationHistory`. Do not send `locationHistory` directly. Other updatable fields include `driverId`, `vehicleId`, `milestone`, `lastNote`, `proofOfDelivery` and `deliveryOtp`.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Trip'
 *           example:
 *             location:
 *               type: "Point"
 *               coordinates: [3.3800, 6.5250]
 *             milestone: "ARRIVED"
 *             lastNote: "Driver arrived at pickup"
 *     responses:
 *       200:
 *         description: Trip updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     trip:
 *                       $ref: '#/components/schemas/Trip'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Trip not found
 */

/**
 * @swagger
 * /api/v1/trips/{id}:
 *   delete:
 *     summary: Delete a trip
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trip ID
 *     responses:
 *       200:
 *         description: Trip deleted (soft delete)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Trip'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Trip not found
 */

/**
 * @swagger
 * /api/v1/trips/{id}/track:
 *   get:
 *     summary: Get trip tracking info
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trip ID
 *     responses:
 *       200:
 *         description: Trip tracking info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     location:
 *                       $ref: '#/components/schemas/GeoPoint'
 *                     locationHistory:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/GeoPoint'
 *                     milestone:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Trip not found
 */
/**
 * @swagger
 * /api/v1/driver/trips/{id}/milestone:
 *   patch:
 *     summary: Update trip milestone
 *     description: Update the current milestone/status of a trip (e.g., STARTED, ARRIVED, IN_TRANSIT, DELIVERED, COMPLETED). Optionally records location and note.
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trip ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               milestone:
 *                 type: string
 *                 enum: [STARTED, ARRIVED, IN_TRANSIT, DELIVERED, COMPLETED]
 *                 description: The new milestone/status
 *               location:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *               note:
 *                 type: string
 *                 description: Optional note about the milestone
 *           example:
 *             milestone: "ARRIVED"
 *             location:
 *               lat: 6.5245
 *               lng: 3.3793
 *             note: "Arrived at pickup location"
 *     responses:
 *       200:
 *         description: Trip milestone updated
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
 *                   example: Trip milestone updated
 *                 data:
 *                   type: object
 *                   properties:
 *                     trip:
 *                       $ref: '#/components/schemas/Trip'
 *       400:
 *         description: Invalid or missing milestone
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Trip not found
 */

/**
 * @swagger
 * /api/v1/geofences:
 *   post:
 *     summary: Create a new geofence
 *     tags: [Geofence]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Geofence'
 *     responses:
 *       201:
 *         description: Geofence created
 *       400:
 *         description: Invalid input
 *   get:
 *     summary: Get all geofences
 *     tags: [Geofence]
 *     responses:
 *       200:
 *         description: List of geofences
 *
 * /api/v1/geofences/{id}:
 *   get:
 *     summary: Get a geofence by ID
 *     tags: [Geofence]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Geofence found
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update a geofence
 *     tags: [Geofence]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Geofence'
 *     responses:
 *       200:
 *         description: Geofence updated
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete a geofence
 *     tags: [Geofence]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Geofence deleted
 *       404:
 *         description: Not found
 *
 * /api/v1/geofences/check-location:
 *   post:
 *     summary: Check driver location against trip geofences
 *     tags: [Geofence]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tripId:
 *                 type: string
 *               longitude:
 *                 type: number
 *               latitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Geofence status
 *
 * /api/v1/geofences/by-trip/{tripId}:
 *   get:
 *     summary: Get all geofences for a trip
 *     tags: [Geofence]
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of geofences for the trip
 *       404:
 *         description: Trip not found
 *
 * components:
 *   schemas:
 *     Geofence:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - geometry
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [start, destination, corridor, restricted]
 *         geometry:
 *           type: object
 *           required:
 *             - type
 *             - coordinates
 *           properties:
 *             type:
 *               type: string
 *               enum: [Point, Polygon, LineString]
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *         radius:
 *           type: number
 *           description: For Point geofences (meters)
 *         buffer:
 *           type: number
 *           description: For corridor geofences (kilometers)
 */
