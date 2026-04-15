/**
 * @swagger
 * tags:
 *   name: Geofence
 *   description: Geofence management and driver location checks
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
