// Request handlers for the Orders API. Each handler validates nothing beyond
// what the service needs, delegates, and maps the result to an HTTP response.
const orderService = require('../services/order.service');
const ApiError = require('../utils/ApiError');

// 1. POST /api/v1/orders
exports.createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body);
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// 2. GET /api/v1/orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const result = await orderService.listOrders(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// 3. GET /api/v1/orders/:id
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// 4. PATCH /api/v1/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (status === undefined) {
      throw new ApiError(400, 'status is required in the request body');
    }
    const order = await orderService.updateOrderStatus(req.params.id, status);
    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// 5. DELETE /api/v1/orders/:id
exports.deleteOrder = async (req, res, next) => {
  try {
    await orderService.deleteOrder(req.params.id);
    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// 6. GET /api/v1/orders/analytics/sales-summary
exports.getSalesSummary = async (req, res, next) => {
  try {
    const summary = await orderService.getSalesSummary();
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

// 7. GET /api/v1/customers/:id/order-history
exports.getCustomerOrderHistory = async (req, res, next) => {
  try {
    const history = await orderService.getCustomerOrderHistory(req.params.id);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};
