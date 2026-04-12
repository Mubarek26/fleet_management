// sms.swagger.js
/**
 * @swagger
 * /api/v1/sms/send:
 *   post:
 *     summary: Send an SMS to a user (AfroMessage)
 *     tags: [SMS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - message
 *             properties:
 *               to:
 *                 type: string
 *                 description: Recipient phone number (international format)
 *                 example: 251911223344
 *               message:
 *                 type: string
 *                 description: Message content
 *                 example: Your account has been approved!
 *     responses:
 *       200:
 *         description: SMS sent successfully
 *       400:
 *         description: Invalid input or missing fields
 *       500:
 *         description: Server error
 *
 * /api/v1/sms/callback:
 *   post:
 *     summary: AfroMessage delivery status callback
 *     tags: [SMS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageId:
 *                 type: string
 *               status:
 *                 type: string
 *               to:
 *                 type: string
 *               deliveredAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Callback received
 *       500:
 *         description: Server error
 */
