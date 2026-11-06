// Express Router configuration + Swagger annotations for customer endpoints
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

/**
 * @swagger
 * tags:
 *   - name: Customers
 *     description: Customer history and lifetime value
 *
 * components:
 *   parameters:
 *     CustomerId:
 *       in: path
 *       name: id
 *       required: true
 *       description: Numeric id of the customer
 *       schema:
 *         type: integer
 *       example: 1
 */

/**
 * @swagger
 * /v1/customers/{id}/order-history:
 *   get:
 *     summary: Customer order history with lifetime spend
 *     description: >
 *       Returns every order of the customer (`order_items` collapsed with SUM)
 *       plus `totalLifetimeSpent` aggregated across the **completed** orders only.
 *     tags: [Customers]
 *     parameters:
 *       - $ref: '#/components/parameters/CustomerId'
 *     responses:
 *       200:
 *         description: Order history of the customer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     customer:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         full_name:
 *                           type: string
 *                           example: Nguyen Van An
 *                         email:
 *                           type: string
 *                           example: an.nguyen@example.com
 *                         phone:
 *                           type: string
 *                           example: '0901234567'
 *                         created_at:
 *                           type: string
 *                           example: '2026-11-01 09:00:00'
 *                     totalOrders:
 *                       type: integer
 *                       example: 3
 *                     totalLifetimeSpent:
 *                       type: number
 *                       example: 42900000
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/OrderSummaryRow'
 *       400:
 *         description: Customer id is not a positive integer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Customer does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id/order-history', orderController.getCustomerOrderHistory);

module.exports = router;
