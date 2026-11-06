// Express Router configuration + Swagger annotations
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Order lifecycle, inventory control and reporting
 *
 * components:
 *   schemas:
 *     OrderItemInput:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *       properties:
 *         productId:
 *           type: integer
 *           example: 1
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     OrderInput:
 *       type: object
 *       required:
 *         - customerId
 *         - items
 *       properties:
 *         customerId:
 *           type: integer
 *           example: 1
 *         items:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/OrderItemInput'
 *     OrderItem:
 *       type: object
 *       properties:
 *         product_id:
 *           type: integer
 *           example: 1
 *         product_name:
 *           type: string
 *           example: Laptop Dell XPS 15
 *         quantity:
 *           type: integer
 *           example: 1
 *         unit_price:
 *           type: number
 *           example: 35000000
 *         subtotal:
 *           type: number
 *           example: 35000000
 *     Order:
 *       type: object
 *       properties:
 *         order_id:
 *           type: integer
 *           example: 1
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *           example: pending
 *         total_amount:
 *           type: number
 *           example: 42900000
 *         created_at:
 *           type: string
 *           example: '2026-11-06 14:30:00'
 *         customer:
 *           type: object
 *           properties:
 *             customer_id:
 *               type: integer
 *               example: 1
 *             full_name:
 *               type: string
 *               example: Nguyen Van An
 *             email:
 *               type: string
 *               example: an.nguyen@example.com
 *             phone:
 *               type: string
 *               example: '0901234567'
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         total_items_count:
 *           type: integer
 *           example: 3
 *     OrderSummaryRow:
 *       type: object
 *       properties:
 *         order_id:
 *           type: integer
 *           example: 1
 *         customer_name:
 *           type: string
 *           example: Nguyen Van An
 *         email:
 *           type: string
 *           example: an.nguyen@example.com
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *           example: pending
 *         total_amount:
 *           type: number
 *           example: 42900000
 *         total_items_count:
 *           type: integer
 *           example: 3
 *         created_at:
 *           type: string
 *           example: '2026-11-06 14:30:00'
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Product Laptop Dell XPS 15 is out of stock
 *   parameters:
 *     OrderId:
 *       in: path
 *       name: id
 *       required: true
 *       description: Numeric id of the order
 *       schema:
 *         type: integer
 *       example: 1
 */

/**
 * @swagger
 * /v1/orders:
 *   post:
 *     summary: Create an order (atomic SQL transaction)
 *     description: >
 *       Validates the payload, then inside a single transaction checks the
 *       customer, locks the product rows (`SELECT ... FOR UPDATE`), verifies
 *       stock, computes `total_amount` from the **current database prices**,
 *       inserts `orders` + `order_items` and deducts the stock.
 *       Any failure rolls the whole transaction back.
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderInput'
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Empty items array, non-positive quantity, or not enough stock
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Customer or one of the products does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', orderController.createOrder);

/**
 * @swagger
 * /v1/orders:
 *   get:
 *     summary: List orders with filtering, pagination and JOIN
 *     description: >
 *       JOINs `customers` and aggregates `order_items` so that each row is one
 *       order with `total_items_count` = SUM(quantity) instead of one row per
 *       order line.
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *         description: Filter by customer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Paginated order list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *                     totalOrders:
 *                       type: integer
 *                       example: 2
 *                     limit:
 *                       type: integer
 *                       example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderSummaryRow'
 *       400:
 *         description: Unknown status filter or malformed customerId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', orderController.getAllOrders);

/**
 * @swagger
 * /v1/orders/analytics/sales-summary:
 *   get:
 *     summary: Sales revenue analytics (SQL aggregation)
 *     description: >
 *       Uses SUM / COUNT / AVG / GROUP BY over the order tables.
 *       Registered before `/orders/{id}` so the literal path is not swallowed
 *       by the `:id` parameter route.
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Revenue summary of completed orders
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
 *                     totalRevenue:
 *                       type: number
 *                       example: 85800000
 *                     completedOrdersCount:
 *                       type: integer
 *                       example: 2
 *                     averageOrderValue:
 *                       type: number
 *                       example: 42900000
 *                     topSellingProducts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product_id:
 *                             type: integer
 *                             example: 1
 *                           product_name:
 *                             type: string
 *                             example: Laptop Dell XPS 15
 *                           totalQuantitySold:
 *                             type: integer
 *                             example: 3
 *                           totalRevenue:
 *                             type: number
 *                             example: 105000000
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/analytics/sales-summary', orderController.getSalesSummary);

/**
 * @swagger
 * /v1/orders/{id}:
 *   get:
 *     summary: Order details with nested JSON items
 *     tags: [Orders]
 *     parameters:
 *       - $ref: '#/components/parameters/OrderId'
 *     responses:
 *       200:
 *         description: Order with customer info and an array of items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Order id is not a positive integer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', orderController.getOrderById);

/**
 * @swagger
 * /v1/orders/{id}/status:
 *   patch:
 *     summary: Update status and restore stock on cancellation
 *     description: >
 *       Moving an order from `pending` or `completed` to `cancelled` restores the
 *       stock of every item in the **same transaction**. An order that is already
 *       cancelled cannot change status again.
 *     tags: [Orders]
 *     parameters:
 *       - $ref: '#/components/parameters/OrderId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, completed, cancelled]
 *                 example: cancelled
 *     responses:
 *       200:
 *         description: Status updated (stock restored when cancelled)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order status updated to cancelled
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Status outside the ENUM, or the order is already cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:id/status', orderController.updateOrderStatus);

/**
 * @swagger
 * /v1/orders/{id}:
 *   delete:
 *     summary: Delete an order and its items
 *     description: >
 *       `order_items` rows are removed automatically by `ON DELETE CASCADE`.
 *       If the order is not cancelled yet, its stock is restored first in the
 *       same transaction.
 *     tags: [Orders]
 *     parameters:
 *       - $ref: '#/components/parameters/OrderId'
 *     responses:
 *       200:
 *         description: Order deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order deleted successfully
 *       400:
 *         description: Order id is not a positive integer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
