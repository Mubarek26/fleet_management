
/**
 * @swagger
 * /api/v1/transactions:
 *   get:
 *     tags: [Transaction]
 *     summary: Get all transactions
 *     description: Retrieve a list of all transactions.
 *     responses:
 *       200:
 *         description: A list of transactions.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 results:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *
 * /api/v1/transactions/{tx_ref}:
 *   get:
 *     tags: [Transaction]
 *     summary: Get transaction by reference
 *     description: Retrieve a single transaction by its tx_ref.
 *     parameters:
 *       - name: tx_ref
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction reference
 *     responses:
 *       200:
 *         description: Transaction found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 */
