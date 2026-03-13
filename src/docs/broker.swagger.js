/**
 * @swagger
 * tags:
 *   - name: Broker
 *     description: Broker-specific order operations
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