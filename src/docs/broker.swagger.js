/**
 * @swagger
 * tags:
 *   - name: Broker
 *     description: Broker-specific order operations
 */

/**
 * @swagger
 * /api/v1/broker/orders/{orderId}/assign-vehicle:
 *   post:
 *     summary: Assign a vehicle to an order
 *     description: Assigns a specific active vehicle to an order that is already company-assigned.
 *     tags: [Broker]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId]
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 example: 67c9fbd9be8f3b0fbd7d8f31
 *     responses:
 *       200:
 *         description: Vehicle assigned successfully
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
 *                   example: Vehicle assigned successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       $ref: '#/components/schemas/MarketplaceOrder'
 *                     assignment:
 *                       type: object
 *       400:
 *         description: Invalid vehicle assignment payload or order state
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order or vehicle not found
 */

/**
 * @swagger
 * /api/v1/broker/assign:
 *   post:
 *     summary: Assign order to transporter
 *     description: Assigns an OPEN or MATCHED order to either a transporter company or a private transporter.
 *     tags: [Broker]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: 67cf77b1be8f3b0fbd7d8fa1
 *               assignmentMode:
 *                 type: string
 *                 enum: [DIRECT_COMPANY, DIRECT_PRIVATE_TRANSPORTER]
 *               targetCompanyId:
 *                 type: string
 *                 example: 67c9fbd9be8f3b0fbd7d8f10
 *               targetTransporterId:
 *                 type: string
 *                 example: 67c9fbd9be8f3b0fbd7d8f11
 *     responses:
 *       200:
 *         description: Order assigned successfully
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
 *                   example: Order assigned successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       $ref: '#/components/schemas/MarketplaceOrder'
 *                     assignment:
 *                       type: object
 *       400:
 *         description: Invalid assignment payload or order state
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order or target not found
 */

/**
 * @swagger
 * /api/v1/broker/match/{orderId}:
 *   get:
 *     summary: Get ranked match candidates for an order
 *     description: Returns a ranked candidate list of transporter companies and/or private transporters for the given order.
 *     tags: [Broker]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 20
 *         description: Maximum number of ranked candidates to return.
 *     responses:
 *       200:
 *         description: Match candidates fetched successfully
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
 *                   example: 4
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: object
 *                     candidates:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Invalid order state or request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /api/v1/broker/orders/{id}/validate:
 *   put:
 *     summary: Validate an order
 *     description: Validates an order against business rules and opens it for assignment when it passes.
 *     tags: [Broker]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               autoTriggered:
 *                 type: boolean
 *                 example: true
 *               validationSource:
 *                 type: string
 *                 example: RULE_ENGINE
 *     responses:
 *       200:
 *         description: Order validated successfully
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
 *                   example: Order validated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       $ref: '#/components/schemas/MarketplaceOrder'
 *                     validation:
 *                       type: object
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */