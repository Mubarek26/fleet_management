// pricingConfig.swagger.js
/**
 * @swagger
 * /api/v1/pricing-config:
 *   get:
 *     summary: Get the current pricing configuration
 *     tags: [Pricing]
 *     responses:
 *       200:
 *         description: The current pricing configuration
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update the pricing configuration
 *     tags: [Pricing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               baseFare:
 *                 type: number
 *               distanceRate:
 *                 type: number
 *               weightRate:
 *                 type: number
 *               serviceFee:
 *                 type: number
 *               taxRate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Pricing configuration updated
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
