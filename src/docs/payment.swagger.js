// payment.swagger.js
/**
 * @swagger
 * /api/v1/payment/initialize:
 *   post:
 *     summary: Initialize a payment for an order
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - currency
 *               - phone_number
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: The ID of the order to pay for
 *               currency:
 *                 type: string
 *                 example: ETB
 *               phone_number:
 *                 type: string
 *                 example: 2519XXXXXXXX
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 *       400:
 *         description: Missing required fields or invalid data
 *       500:
 *         description: Server error
 *
 * /api/v1/payment/verify:
 *   post:
 *     summary: Verify a payment by transaction reference
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tx_ref
 *             properties:
 *               tx_ref:
 *                 type: string
 *                 description: The transaction reference to verify
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Missing required fields or invalid data
 *       500:
 *         description: Server error
 */
