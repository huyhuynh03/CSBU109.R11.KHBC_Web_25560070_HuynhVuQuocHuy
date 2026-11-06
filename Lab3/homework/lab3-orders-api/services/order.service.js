// Business logic for orders: atomic SQL transactions, stock control and reporting.
// Controllers never build SQL; they only translate the result into HTTP.
const pool = require('../config/db');
const ApiError = require('../utils/ApiError');
const { toCents, toAmount } = require('../utils/money');
const { parsePagination } = require('../utils/pagination');

const ORDER_STATUSES = ['pending', 'completed', 'cancelled'];

// ---------------------------------------------------------------------------
// Payload validation
// ---------------------------------------------------------------------------

// Returns a normalised [{ productId, quantity }] list.
// Duplicated productIds are merged, otherwise the same row would be checked
// against the full stock twice ("4 of 5 in stock" passes twice, then the order
// deducts 8 and drives stock negative).
const normaliseItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'items must be a non-empty array');
  }

  const merged = new Map();
  items.forEach((item, index) => {
    const productId = Number(item?.productId);
    const quantity = Number(item?.quantity);

    if (!Number.isInteger(productId) || productId <= 0) {
      throw new ApiError(400, `items[${index}].productId must be a positive integer`);
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ApiError(400, `items[${index}].quantity must be a positive integer`);
    }

    merged.set(productId, (merged.get(productId) || 0) + quantity);
  });

  return [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));
};

const parseId = (value, label) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `${label} must be a positive integer`);
  }
  return id;
};

// ---------------------------------------------------------------------------
// POST /api/v1/orders
// ---------------------------------------------------------------------------
const createOrder = async (payload) => {
  const customerId = parseId(payload?.customerId, 'customerId');
  const items = normaliseItems(payload?.items);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [customers] = await conn.query('SELECT id FROM customers WHERE id = ?', [customerId]);
    if (customers.length === 0) {
      throw new ApiError(404, `Customer with id ${customerId} does not exist`);
    }

    // Lock every product row for the rest of the transaction, in ascending id
    // order so that two concurrent orders touching the same products lock them
    // in the same sequence and cannot deadlock each other.
    const productIds = items.map((item) => item.productId).sort((a, b) => a - b);
    const [products] = await conn.query(
      'SELECT id, product_name, price, stock FROM products WHERE id IN (?) ORDER BY id FOR UPDATE',
      [productIds]
    );

    const stockById = new Map(products.map((product) => [product.id, product]));

    for (const item of items) {
      const product = stockById.get(item.productId);
      if (!product) {
        throw new ApiError(404, `Product with id ${item.productId} does not exist`);
      }
      if (product.stock < item.quantity) {
        throw new ApiError(400, `Product ${product.product_name} is out of stock`);
      }
    }

    // Price is read from the database, never from the client payload.
    let totalCents = 0;
    const lineItems = items.map((item) => {
      const product = stockById.get(item.productId);
      totalCents += toCents(product.price) * item.quantity;
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: Number(product.price)
      };
    });

    const [orderResult] = await conn.query(
      'INSERT INTO orders (customer_id, status, total_amount) VALUES (?, ?, ?)',
      [customerId, 'pending', toAmount(totalCents)]
    );
    const orderId = orderResult.insertId;

    await conn.query(
      'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ?',
      [lineItems.map((line) => [orderId, line.productId, line.quantity, line.unitPrice])]
    );

    for (const line of lineItems) {
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [
        line.quantity,
        line.productId
      ]);
    }

    await conn.commit();
    return getOrderById(orderId);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/orders
// ---------------------------------------------------------------------------
const listOrders = async (query) => {
  const { page, limit, offset } = parsePagination(query);
  const { status, customerId } = query;

  const where = [];
  const params = [];

  if (status !== undefined && status !== '') {
    if (!ORDER_STATUSES.includes(status)) {
      throw new ApiError(400, `status must be one of: ${ORDER_STATUSES.join(', ')}`);
    }
    where.push('o.status = ?');
    params.push(status);
  }
  if (customerId !== undefined && customerId !== '') {
    where.push('o.customer_id = ?');
    params.push(parseId(customerId, 'customerId'));
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // COUNT and the page query share the same WHERE, so totalPages stays correct.
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM orders o ${whereSql}`,
    params
  );

  // One row per order: order_items is collapsed with SUM, so LIMIT keeps
  // returning orders (not order lines).
  const [rows] = await pool.query(
    `SELECT o.id AS order_id,
            c.full_name AS customer_name,
            c.email,
            o.status,
            o.total_amount,
            COALESCE(SUM(oi.quantity), 0) AS total_items_count,
            o.created_at
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ${whereSql}
      GROUP BY o.id, c.full_name, c.email, o.status, o.total_amount, o.created_at
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    count: rows.length,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
      limit
    },
    data: rows
  };
};

// ---------------------------------------------------------------------------
// GET /api/v1/orders/:id
// ---------------------------------------------------------------------------
const getOrderById = async (id) => {
  const orderId = parseId(id, 'Order id');

  const [orders] = await pool.query(
    `SELECT o.id AS order_id,
            o.status,
            o.total_amount,
            o.created_at,
            c.id AS customer_id,
            c.full_name AS customer_name,
            c.email,
            c.phone
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
      WHERE o.id = ?`,
    [orderId]
  );

  if (orders.length === 0) {
    throw new ApiError(404, `No order found with id ${orderId}`);
  }

  const [items] = await pool.query(
    `SELECT oi.product_id,
            p.product_name,
            oi.quantity,
            oi.unit_price,
            ROUND(oi.quantity * oi.unit_price, 2) AS subtotal
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
      ORDER BY oi.id`,
    [orderId]
  );

  const order = orders[0];
  return {
    order_id: order.order_id,
    status: order.status,
    total_amount: Number(order.total_amount),
    created_at: order.created_at,
    customer: {
      customer_id: order.customer_id,
      full_name: order.customer_name,
      email: order.email,
      phone: order.phone
    },
    items,
    total_items_count: items.reduce((sum, item) => sum + item.quantity, 0)
  };
};

// ---------------------------------------------------------------------------
// PATCH /api/v1/orders/:id/status
// ---------------------------------------------------------------------------
const updateOrderStatus = async (id, newStatus) => {
  const orderId = parseId(id, 'Order id');

  if (typeof newStatus !== 'string' || !ORDER_STATUSES.includes(newStatus)) {
    throw new ApiError(400, `status must be one of: ${ORDER_STATUSES.join(', ')}`);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orders] = await conn.query(
      'SELECT id, status FROM orders WHERE id = ? FOR UPDATE',
      [orderId]
    );
    if (orders.length === 0) {
      throw new ApiError(404, `No order found with id ${orderId}`);
    }

    const current = orders[0].status;

    // Cancelling is terminal: once an order is cancelled its stock has already
    // been given back, so any further transition would corrupt the inventory.
    if (current === 'cancelled') {
      throw new ApiError(400, 'Order is already cancelled and its status cannot change again');
    }

    // pending/completed -> cancelled gives the reserved stock back.
    if (newStatus === 'cancelled') {
      const [items] = await conn.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ? ORDER BY product_id',
        [orderId]
      );
      for (const item of items) {
        await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [
          item.quantity,
          item.product_id
        ]);
      }
    }

    await conn.query('UPDATE orders SET status = ? WHERE id = ?', [newStatus, orderId]);
    await conn.commit();
    return getOrderById(orderId);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/v1/orders/:id
// ---------------------------------------------------------------------------
const deleteOrder = async (id) => {
  const orderId = parseId(id, 'Order id');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orders] = await conn.query(
      'SELECT id, status FROM orders WHERE id = ? FOR UPDATE',
      [orderId]
    );
    if (orders.length === 0) {
      throw new ApiError(404, `No order found with id ${orderId}`);
    }

    // A cancelled order already returned its stock when it was cancelled.
    if (orders[0].status !== 'cancelled') {
      const [items] = await conn.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ? ORDER BY product_id',
        [orderId]
      );
      for (const item of items) {
        await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [
          item.quantity,
          item.product_id
        ]);
      }
    }

    // order_items rows disappear through ON DELETE CASCADE.
    await conn.query('DELETE FROM orders WHERE id = ?', [orderId]);
    await conn.commit();
    return { order_id: orderId };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/orders/analytics/sales-summary
// ---------------------------------------------------------------------------
const getSalesSummary = async () => {
  const [[summary]] = await pool.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS totalRevenue,
            COUNT(*) AS completedOrdersCount,
            COALESCE(AVG(total_amount), 0) AS averageOrderValue
       FROM orders
      WHERE status = 'completed'`
  );

  // "Top selling" is measured on completed orders only: pending orders have not
  // been paid for, cancelled ones were returned.
  const [topSellingProducts] = await pool.query(
    `SELECT p.id AS product_id,
            p.product_name,
            SUM(oi.quantity) AS totalQuantitySold,
            ROUND(SUM(oi.quantity * oi.unit_price), 2) AS totalRevenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
      WHERE o.status = 'completed'
      GROUP BY p.id, p.product_name
      ORDER BY totalQuantitySold DESC, totalRevenue DESC
      LIMIT 3`
  );

  return {
    totalRevenue: Number(summary.totalRevenue),
    completedOrdersCount: Number(summary.completedOrdersCount),
    averageOrderValue: Number(Number(summary.averageOrderValue).toFixed(2)),
    topSellingProducts
  };
};

// ---------------------------------------------------------------------------
// GET /api/v1/customers/:id/order-history
// ---------------------------------------------------------------------------
const getCustomerOrderHistory = async (id) => {
  const customerId = parseId(id, 'Customer id');

  const [customers] = await pool.query(
    'SELECT id, full_name, email, phone, created_at FROM customers WHERE id = ?',
    [customerId]
  );
  if (customers.length === 0) {
    throw new ApiError(404, `No customer found with id ${customerId}`);
  }

  const [orders] = await pool.query(
    `SELECT o.id AS order_id,
            o.status,
            o.total_amount,
            o.created_at,
            COALESCE(SUM(oi.quantity), 0) AS total_items_count
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.customer_id = ?
      GROUP BY o.id, o.status, o.total_amount, o.created_at
      ORDER BY o.created_at DESC, o.id DESC`,
    [customerId]
  );

  const [[spending]] = await pool.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS totalLifetimeSpent
       FROM orders
      WHERE customer_id = ? AND status = 'completed'`,
    [customerId]
  );

  return {
    customer: customers[0],
    totalOrders: orders.length,
    totalLifetimeSpent: Number(spending.totalLifetimeSpent),
    orders
  };
};

module.exports = {
  ORDER_STATUSES,
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getSalesSummary,
  getCustomerOrderHistory
};
