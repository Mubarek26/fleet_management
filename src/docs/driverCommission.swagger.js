/**
 * @swagger
 * /api/v1/driver/commission:
 *   get:
 *     summary: Get my total commission
 *     description: Retrieve the total commission earned and all related transactions for the authenticated driver.
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Commission summary retrieved
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
 *                     totalCommission:
 *                       type: number
 *                       example: 1200.50
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *
 * /api/v1/driver/commission/history:
 *   get:
 *     summary: Get my commission history
 *     description: Retrieve all commission transactions for the authenticated driver, most recent first.
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Commission history retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 */
