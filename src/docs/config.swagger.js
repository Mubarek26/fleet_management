/**
 * @swagger
 * /api/v1/config/commission:
 *   get:
 *     summary: Get commission configuration
 *     description: Retrieve the current platform and driver commission rates.
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Commission config retrieved
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
 *                     commissionRate:
 *                       type: number
 *                       example: 0.1
 *                     driverCommissionRate:
 *                       type: number
 *                       example: 0.05
 *   patch:
 *     summary: Update commission configuration
 *     description: Update the platform and/or driver commission rates.
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               commissionRate:
 *                 type: number
 *                 example: 0.12
 *               driverCommissionRate:
 *                 type: number
 *                 example: 0.07
 *     responses:
 *       200:
 *         description: Commission config updated
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
 *                     commissionRate:
 *                       type: number
 *                       example: 0.12
 *                     driverCommissionRate:
 *                       type: number
 *                       example: 0.07
 */
