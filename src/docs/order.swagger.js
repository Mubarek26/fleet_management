/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Marketplace order management endpoints
 */

/**
 * @swagger
 * /api/v1/orders/marketplace:
 *   post:
 *     summary: Create a marketplace order
 *     description: Allows authenticated shippers, vendors, brokers, or super admins to create an order and either send it directly to a transporter company, send it directly to a private transporter, or post it openly so both can see it. Use `assignmentMode` to control the behavior.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MarketplaceOrderCreateRequest'
 *           example:
 *             assignmentMode: OPEN_MARKETPLACE
 *             title: Addis to Adama FMCG delivery
 *             description: Deliver 120 boxes of packaged goods.
 *             pickupLocation:
 *               address: Bole Road Warehouse 12
 *               city: Addis Ababa
 *               country: Ethiopia
 *               contactName: Abebe Kebede
 *               contactPhone: 0911223344
 *             deliveryLocation:
 *               address: Adama Distribution Center
 *               city: Adama
 *               country: Ethiopia
 *               contactName: Meron Bekele
 *               contactPhone: 0922334455
 *             cargo:
 *               type: FMCG
 *               description: Cartoned dry goods
 *               weightKg: 1800
 *               quantity: 120
 *               unit: BOX
 *               specialHandling:
 *                 - Keep dry
 *             vehicleRequirements:
 *               vehicleType: BOX_TRUCK
 *               minimumCapacityKg: 2000
 *             pickupDate: 2026-03-15T08:00:00.000Z
 *             deliveryDeadline: 2026-03-16T18:00:00.000Z
 *             proposedBudget: 25000
 *             currency: ETB
 *             paymentMethod: BANK_TRANSFER
 *             negotiable: true
 *             specialInstructions: Driver should call 30 minutes before arrival.
 *     responses:
 *       201:
 *         description: Marketplace order created successfully
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
 *                   example: Marketplace order created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       $ref: '#/components/schemas/MarketplaceOrder'
 *       400:
 *         description: Invalid request payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: User role is not allowed to create marketplace orders
 */