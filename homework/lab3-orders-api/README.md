# Lab 3 Homework — Advanced Orders & Inventory Management API

**Sinh viên:** Huỳnh Vũ Quốc Huy — 25560070  
**Môn:** Web & Database — Lab 3

## 1. Phạm vi

API thương mại điện tử dùng **Node.js, Express.js, MySQL và mysql2/promise**, được tổ chức theo luồng:

`routes → controllers → services → MySQL`

Các yêu cầu chính đã triển khai:

- Database `ecommerce_order_db` gồm `customers`, `products`, `orders`, `order_items` và foreign-key constraints.
- Tạo order trong transaction nguyên tử: kiểm tra customer, khóa product bằng `SELECT ... FOR UPDATE`, kiểm tra stock, lấy giá hiện tại từ DB, insert order/order_items và trừ kho.
- Rollback khi bất kỳ bước nào thất bại.
- JOIN + `SUM(quantity)` cho danh sách order và nested JSON cho chi tiết order.
- PATCH status; chuyển sang `cancelled` hoàn kho trong cùng transaction; order đã cancelled là trạng thái kết thúc.
- DELETE order; `order_items` tự xóa bằng `ON DELETE CASCADE`, đồng thời hoàn kho nếu order chưa cancelled.
- Sales analytics bằng `SUM`, `COUNT`, `AVG`, `GROUP BY`.
- Swagger UI cho toàn bộ endpoint và Postman collection có cả success/error cases.

## 2. Cài đặt

Yêu cầu: Node.js 18+ và MySQL 8+ đang chạy.

```bash
cd homework/lab3-orders-api
npm install
```

Nếu MySQL không dùng cấu hình mặc định, thiết lập biến môi trường. Có thể copy [`.env.example`](.env.example) để xem danh sách biến; project không thêm dotenv để giữ dependency tối thiểu.

```bat
set DB_HOST=127.0.0.1
set DB_PORT=3306
set DB_USER=root
set DB_PASSWORD=your_mysql_password
set DB_NAME=ecommerce_order_db
```

## 3. Khởi tạo database và dữ liệu mẫu

```bash
npm run init-db
npm run seed
```

`npm run seed` tạo 4 customers, 5 products, 4 orders và nhiều order items. Product 5 được giữ stock bằng 0 để test lỗi out-of-stock.

Muốn tạo lại từ đầu:

```bash
npm run init-db:reset
npm run seed
```

## 4. Chạy server

```bash
npm start
# hoặc
npm run dev
```

| Dịch vụ | URL |
| --- | --- |
| Health | http://localhost:3000/health |
| API | http://localhost:3000/api/v1 |
| Swagger UI | http://localhost:3000/api-docs |

## 5. Endpoint

| Method | Path | Mô tả |
| --- | --- | --- |
| POST | `/api/v1/orders` | Tạo order bằng transaction |
| GET | `/api/v1/orders` | Danh sách, filter `status/customerId`, pagination |
| GET | `/api/v1/orders/:id` | Chi tiết order, customer và nested items |
| PATCH | `/api/v1/orders/:id/status` | Đổi status, hoàn stock khi cancelled |
| DELETE | `/api/v1/orders/:id` | Xóa order, cascade order_items, hoàn stock |
| GET | `/api/v1/orders/analytics/sales-summary` | Doanh thu, số order, average, top 3 products |
| GET | `/api/v1/customers/:id/order-history` | Lịch sử order và `totalLifetimeSpent` |

Payload tạo order:

```json
{
  "customerId": 1,
  "items": [
    { "productId": 1, "quantity": 1 },
    { "productId": 2, "quantity": 2 }
  ]
}
```

## 6. Kiểm thử

Khởi động server ở terminal 1, sau đó chạy:

```bash
npm test
```

Smoke test bao phủ:

- 201/400/404 cho create order.
- Payload rỗng, quantity không dương, customer/product không tồn tại, out-of-stock.
- Kiểm tra rollback không tạo order và không trừ stock một phần.
- Filter, pagination, JOIN, nested JSON.
- Hoàn kho khi cancel/delete và chống hoàn kho hai lần.
- Enum status, order đã cancelled không đổi lại.
- Sales summary và customer history.
- Hai request đồng thời mua unit cuối: chỉ một request thành công nhờ `FOR UPDATE`.

Request thủ công nằm trong [`tests/api.http`](tests/api.http). Postman collection nằm trong [`tests/postman-collection.json`](tests/postman-collection.json). Swagger có nút **Try it out** tại `/api-docs`.

## 7. Cấu trúc thư mục

```text
lab3-orders-api/
├── config/db.js, swagger.js
├── controllers/order.controller.js
├── routes/order.routes.js, customer.routes.js
├── services/order.service.js
├── scripts/init-db.js, seed.js
├── sql/schema.sql
├── tests/api.http, postman-collection.json, smoke-test.js
├── utils/ApiError.js, money.js, pagination.js
├── package.json
├── server.js
└── README.md
```

## 8. Lưu ý môi trường

Nếu gặp `Access denied for user 'root'`, hãy đặt đúng `DB_PASSWORD` của MySQL trước khi chạy `npm run init-db`; code và schema không tự thay đổi mật khẩu tài khoản MySQL.
