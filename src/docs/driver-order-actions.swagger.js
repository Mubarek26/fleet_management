/**
 * @swagger
 * /api/v1/driver/assignments/{orderId}/accept:
 *   patch:
 *     summary: Driver accepts assigned order
 *     description: Allows a driver to accept an order that is in ASSIGNED state.
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID to accept
 *     responses:
 *       200:
 *         description: Order accepted successfully
 *       400:
 *         description: Order is not in ASSIGNED state
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
/**
 * @swagger
 * /api/v1/driver/assignments/{orderId}/reject:
 *   patch:
 *     summary: Driver rejects assigned order
 *     description: Allows a driver to reject an order that is in ASSIGNED state.
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID to reject
 *     responses:
 *       200:
 *         description: Order rejected successfully
 *       400:
 *         description: Order is not in ASSIGNED state
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
/**
 * @swagger
 * /api/v1/driver/assignments/{orderId}/start:
 *   patch:
 *     summary: Driver starts order assignment
 *     description: Allows a driver to start an order that is in ACCEPTED or ASSIGNED state.
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID to start
 *     responses:
 *       200:
 *         description: Order started successfully
 *       400:
 *         description: Order must be accepted or assigned to start
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
/**
 * @swagger
 * /api/v1/driver/assignments/{orderId}/arrive:
 *   patch:
 *     summary: Driver marks arrival at pickup
 *     description: Allows a driver to mark arrival at pickup for an order in IN_TRANSIT state.
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID to mark as arrived
 *     responses:
 *       200:
 *         description: Arrival marked successfully
 *       400:
 *         description: Order must be IN_TRANSIT to arrive at pickup
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
/**
 * @swagger
 * /api/v1/driver/assignments/{orderId}/complete:
 *   patch:
 *     summary: Driver completes order assignment
 *     description: Allows a driver to complete an order that is in ARRIVED state.
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID to complete
 *     responses:
 *       200:
 *         description: Order completed successfully
 *       400:
 *         description: Order must be ARRIVED to complete
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
