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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Trip'
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Trip'
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
