/**
 * @swagger
 * tags:
 *   - name: Contract
 *     description: Contract and partnership management endpoints
 */

/**
 * @swagger
 * /api/v1/contract/initiate:
 *   post:
 *     summary: Initiate a partnership contract request
 *     description: Allows a VENDOR to send a partnership request to an active transporter company. The backend only accepts `transporterCompanyId` and optional `message` in the request body. Contract fields such as `vendorId`, `startDate`, `endDate`, `commissionRate`, and `status` are generated or managed by the server.
 *     tags: [Contract]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transporterCompanyId
 *             properties:
 *               transporterCompanyId:
 *                 type: string
 *                 description: MongoDB id of the transporter company to receive the partnership request
 *                 example: 67c9fbd9be8f3b0fbd7d8f10
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Optional message sent with the partnership request
 *                 example: We would like to partner with your company for long-term delivery operations.
 *           example:
 *             transporterCompanyId: 67c9fbd9be8f3b0fbd7d8f10
 *             message: We would like to partner with your company for long-term delivery operations.
 *     responses:
 *       201:
 *         description: Partnership request sent successfully
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
 *                   example: Partnership request sent successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     contract:
 *                       $ref: '#/components/schemas/ContractPopulated'
 *       400:
 *         description: Missing required transporter company id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only vendors can initiate partnership requests
 *       404:
 *         description: Transporter company not found or inactive
 *       409:
 *         description: Pending or accepted contract already exists
 */

/**
 * @swagger
 * /api/v1/contract/vendor:
 *   get:
 *     summary: Get contracts created by the authenticated vendor
 *     tags: [Contract]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         description: Filter contracts by status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, REJECTED, CANCELLED, TERMINATED]
 *     responses:
 *       200:
 *         description: Vendor contracts fetched successfully
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
 *                   example: 1
 *                 data:
 *                   type: object
 *                   properties:
 *                     contracts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ContractPopulated'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only vendors can view their contracts
 */

/**
 * @swagger
 * /api/v1/contract/company:
 *   get:
 *     summary: Get contracts received by the authenticated company
 *     description: Allows a COMPANY_ADMIN or SUPER_ADMIN to retrieve incoming partnership requests. COMPANY_ADMIN may also filter by companyId.
 *     tags: [Contract]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         description: Filter contracts by status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, REJECTED, CANCELLED, TERMINATED]
 *       - in: query
 *         name: companyId
 *         required: false
 *         description: Company id filter supported by the current controller implementation
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Company contracts fetched successfully
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
 *                   example: 1
 *                 data:
 *                   type: object
 *                   properties:
 *                     contracts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ContractPopulated'
 *       400:
 *         description: Authenticated user is not linked to a company
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only company admins can view incoming partnership requests
 */

/**
 * @swagger
 * /api/v1/contract/{id}/approve:
 *   put:
 *     summary: Approve a pending contract request
 *     description: Allows a COMPANY_ADMIN or SUPER_ADMIN linked to the target company to approve a pending request.
 *     tags: [Contract]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Contract id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Partnership request approved successfully
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
 *                   example: Partnership request approved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     contract:
 *                       $ref: '#/components/schemas/ContractPopulated'
 *       400:
 *         description: Contract is already processed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not allowed to approve this request
 *       404:
 *         description: Contract request not found
 */

/**
 * @swagger
 * /api/v1/contract/{id}/terminate:
 *   put:
 *     summary: Terminate a contract
 *     description: Allows the owning VENDOR, the linked COMPANY_ADMIN, or a SUPER_ADMIN to terminate a contract.
 *     tags: [Contract]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Contract id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contract terminated successfully
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
 *                   example: Contract terminated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     contract:
 *                       $ref: '#/components/schemas/ContractPopulated'
 *       400:
 *         description: Contract is already closed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not allowed to terminate this contract
 *       404:
 *         description: Contract not found
 */
