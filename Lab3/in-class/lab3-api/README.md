# Lab 3 — RESTful API, Routing, Postman & Swagger

**Sinh viên:** Huỳnh Vũ Quốc Huy — 25560070
**Môn:** Web & Database

Thư mục này chứa phần **In-Class Exercises** của Lab 3:

- **Exercise 1:** RESTful API chuẩn với Express Router + Mongoose (Products CRUD, filter, phân trang).
- **Extended requirement:** module Router + Controller đầy đủ cho **Categories** (`/api/categories`).
- **Exercise 2:** Tài liệu API tương tác với Swagger UI (OpenAPI 3.0) dùng `swagger-jsdoc` + `swagger-ui-express`.

---

## 1. Cài đặt

```bash
cd in-class/lab3-api
npm install
```

Yêu cầu MongoDB đang chạy tại `mongodb://127.0.0.1:27017`.

## 2. Chạy server

```bash
npm start          # node server.js
# hoặc
npm run dev        # node --watch server.js (tự restart khi sửa code)
```

| Dịch vụ | URL |
| --- | --- |
| API | `http://localhost:3000/api` |
| Swagger UI | `http://localhost:3000/api-docs` |

Database mặc định: `shop_lab3_db` (đổi bằng biến môi trường `MONGO_URI`).

## 3. Dữ liệu mẫu

```bash
node scripts/seed.js
```

Xoá dữ liệu cũ rồi chèn 6 products + 4 categories (slug được sinh tự động).

## 4. Kiểm thử

```bash
node tests/smoke-test.js
```

Script chạy 27 assertion qua toàn bộ endpoint (201/400/404/409, phân trang, filter, slug, PATCH).
Kết quả hiện tại: **27 passed / 0 failed**.

Các request mẫu để thử bằng tay (VS Code REST Client / IntelliJ HTTP Client) nằm ở
[`tests/api.http`](tests/api.http).

---

## 5. Cấu trúc project

```
lab3-api/
├── config/
│   └── swagger.js              # Cấu hình Swagger / OpenAPI 3.0
├── controllers/
│   ├── product.controller.js   # Handlers cho Products
│   └── category.controller.js  # Handlers + validation middleware cho Categories
├── models/
│   ├── product.model.js        # Schema Product
│   └── category.model.js       # Schema Category (slug hook)
├── routes/
│   ├── product.routes.js       # Router Products + @swagger annotations
│   └── category.routes.js      # Router Categories + @swagger annotations
├── scripts/
│   └── seed.js                 # Chèn dữ liệu mẫu
├── tests/
│   ├── api.http                # Request mẫu
│   └── smoke-test.js           # Test tự động
├── package.json
└── server.js                   # Entry point + global error handler
```

Luồng xử lý: **Route → Controller → Model**.

---

## 6. Danh sách endpoint

### Products — `/api/products`

| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `/api/products` | Danh sách + filter + phân trang |
| POST | `/api/products` | Tạo sản phẩm |
| GET | `/api/products/:id` | Chi tiết sản phẩm |
| PUT | `/api/products/:id` | Cập nhật (chỉ field được gửi) |
| DELETE | `/api/products/:id` | Xoá sản phẩm |

**Query params của GET:** `category`, `minPrice`, `maxPrice`, `page` (default 1), `limit` (default 5).

### Categories — `/api/categories`

| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `/api/categories` | Danh sách + phân trang + sắp xếp |
| POST | `/api/categories` | Tạo category (slug tự sinh) |
| GET | `/api/categories/:id` | Chi tiết category |
| PATCH | `/api/categories/:id` | Cập nhật từng phần |
| DELETE | `/api/categories/:id` | Xoá category |

**Query params của GET:** `page`, `limit`, `sort` (`name` \| `slug` \| `createdAt` \| `updatedAt`), `order` (`asc` \| `desc`).

---

## 7. Bảng mã lỗi

| Tình huống | Status | Nguyên nhân |
| --- | --- | --- |
| Thiếu `name`, `price` âm, `category` ngoài enum | **400** | Mongoose `ValidationError` |
| ObjectId sai định dạng | **400** | Mongoose `CastError` |
| ID hợp lệ nhưng không tồn tại | **404** | Controller trả về thủ công |
| Tên/slug category bị trùng | **409** | Mongo error code `11000` |
| Name category < 3 ký tự | **400** | Validation middleware |

Global error handler trong [`server.js`](server.js) map các lỗi trên, nhờ vậy client
nhận đúng 4xx thay vì 500.

---

## 8. Ghi chú triển khai

**Slug của Category** — hook được gắn ở `pre('validate')` chứ không phải `pre('save')`.
Lý do: `slug` có `required: true`, mà validation chạy *trước* `save`, nên nếu sinh slug
trong `pre('save')` thì request sẽ luôn fail với lỗi "Category slug is required".

**Regenerate slug khi PATCH** — `findByIdAndUpdate` **không** kích hoạt document hooks.
Vì vậy controller tự gọi `Category.slugify(updates.name)` khi payload có `name`:

```js
if (updates.name !== undefined) {
  updates.slug = Category.slugify(updates.name);
}
```

**PUT so với PATCH** — `findByIdAndUpdate` chỉ đổi những field có trong body (giống PATCH).
Nếu cần PUT thật sự (thay toàn bộ document) thì phải dùng `findOneAndReplace`.

**Swagger annotations** — dùng `tags` để tách sidebar thành *Products* và *Categories*;
thông tin path param được khai báo một lần trong `components.parameters`
(`ProductId`, `CategoryId`) rồi tham chiếu bằng `$ref`.

**Chạy test nhanh bằng Postman:** import `tests/api.http` hoặc dùng trực tiếp Swagger UI
tại `http://localhost:3000/api-docs` (đã bật sẵn để "Try it out").
