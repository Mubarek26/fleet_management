/**
 * @swagger
 * tags:
 *   - name: Driver
 *     description: Driver self-service endpoints
 */

/**
 * @swagger
 * /api/v1/driver/status:
 *   patch:
 *     summary: Update logged-in driver status and availability
 *     description: Allows an authenticated driver to update their own profile status and optional availability flag.
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
 *                 enum: [PENDING, ACTIVE, SUSPENDED]
 *                 example: ACTIVE
 *               isAvailable:
 *                 type: boolean
 *                 example: true
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
 *         description: Invalid request payload
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
 *     summary: Get logged-in driver assignments
 *     description: Returns orders assigned to the authenticated driver. Supports optional status filtering.
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ASSIGNED, IN_TRANSIT, DELIVERED]
 *         description: Filter assignments by order status.
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
 *                         $ref: '#/components/schemas/MarketplaceOrder'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */