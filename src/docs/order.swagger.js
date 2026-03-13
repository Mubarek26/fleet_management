/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Marketplace order management endpoints
 */

/**
 * @swagger
 * /api/v1/orders/marketplace:
 *   get:
 *     summary: Get open marketplace orders
 *     description: Returns active `OPEN_MARKETPLACE` orders that transporter company admins and private transporters can browse and apply to.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title, description, cargo type, pickup address, or delivery address.
 *       - in: query
 *         name: pickupCity
 *         schema:
 *           type: string
 *       - in: query
 *         name: deliveryCity
 *         schema:
 *           type: string
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Open marketplace orders fetched successfully
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
 *                   example: 5
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MarketplaceOrder'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only transporter company admins and private transporters can view marketplace orders
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

/**
 * @swagger
 * /api/v1/orders/mine:
 *   get:
 *     summary: Get my created orders
 *     description: Returns all orders created by the authenticated user. Optional query params `status`, `postStatus`, and `assignmentMode` can be used to filter the result.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, MATCHED, ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED]
 *       - in: query
 *         name: postStatus
 *         schema:
 *           type: string
 *           enum: [ACTIVE, EXPIRED, CANCELLED, COMPLETED, ARCHIVED, DELETED]
 *       - in: query
 *         name: assignmentMode
 *         schema:
 *           type: string
 *           enum: [DIRECT_COMPANY, DIRECT_PRIVATE_TRANSPORTER, OPEN_MARKETPLACE]
 *     responses:
 *       200:
 *         description: Orders fetched successfully
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
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MarketplaceOrder'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/orders/{orderId}/proposals:
 *   post:
 *     summary: Submit a proposal for an order
 *     description: Allows a transporter company admin or private transporter to submit a proposal for an eligible order.
 *     tags: [Orders]
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
 *             $ref: '#/components/schemas/OrderProposalCreateRequest'
 *           example:
 *             proposedPrice: 24000
 *             currency: ETB
 *             message: We can pick up within 2 hours.
 *             estimatedPickupDate: 2026-03-15T10:00:00.000Z
 *             vehicleDetails: 5 ton box truck available.
 *     responses:
 *       201:
 *         description: Proposal submitted successfully
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
 *                   example: Proposal submitted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     proposal:
 *                       $ref: '#/components/schemas/OrderProposal'
 *       400:
 *         description: Invalid request payload
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: User is not allowed to submit a proposal for this order
 *       409:
 *         description: A proposal already exists for this order by the same transporter identity
 *   get:
 *     summary: List proposals for an order
 *     description: The order creator can see all proposals. A company admin or private transporter only sees their own proposal entries for that order.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Proposals fetched successfully
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
 *                     proposals:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/OrderProposal'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: User is not allowed to view these proposals
 */

/**
 * @swagger
 * /api/v1/orders/proposals/mine:
 *   get:
 *     summary: List my submitted proposals
 *     description: Returns proposals submitted by the authenticated company admin or private transporter.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My proposals fetched successfully
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
 *                   example: 3
 *                 data:
 *                   type: object
 *                   properties:
 *                     proposals:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/OrderProposal'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only company admins and private transporters can access this endpoint
 */

/**
 * @swagger
 * /api/v1/orders/{orderId}/proposals/{proposalId}/accept:
 *   patch:
 *     summary: Accept an order proposal
 *     description: Allows the order creator to accept one proposal and assign the order to that transporter.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Proposal accepted successfully
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
 *                   example: Proposal accepted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       $ref: '#/components/schemas/MarketplaceOrder'
 *                     proposal:
 *                       $ref: '#/components/schemas/OrderProposal'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only the order creator can accept proposals
 *       404:
 *         description: Order or proposal not found
 */

/**
 * @swagger
 * /api/v1/orders/{orderId}/proposals/{proposalId}/reject:
 *   patch:
 *     summary: Reject an order proposal
 *     description: Allows the order creator to reject a pending proposal.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderProposalRejectRequest'
 *           example:
 *             reason: Pickup window is too late for this order.
 *     responses:
 *       200:
 *         description: Proposal rejected successfully
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
 *                   example: Proposal rejected successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     proposal:
 *                       $ref: '#/components/schemas/OrderProposal'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only the order creator can reject proposals
 *       404:
 *         description: Order or proposal not found
 */