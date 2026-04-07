/**
 * @swagger
 * /api/driver/trips/{id}/milestone:
 *   patch:
 *     summary: Update trip milestone
 *     description: Update the current milestone/status of a trip (e.g., STARTED, ARRIVED, IN_TRANSIT, DELIVERED, COMPLETED). Optionally records location and note.
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trip ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               milestone:
 *                 type: string
 *                 enum: [STARTED, ARRIVED, IN_TRANSIT, DELIVERED, COMPLETED]
 *                 description: The new milestone/status
 *               location:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *               note:
 *                 type: string
 *                 description: Optional note about the milestone
 *     responses:
 *       200:
 *         description: Trip milestone updated
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
 *                   example: Trip milestone updated
 *                 data:
 *                   type: object
 *                   properties:
 *                     trip:
 *                       $ref: '#/components/schemas/Trip'
 *       400:
 *         description: Invalid or missing milestone
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Trip not found
 */
