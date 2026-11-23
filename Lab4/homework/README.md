# E-commerce Admin & Storefront – Backend

REST API (Express 5 + MongoDB/Mongoose) cung cấp dữ liệu và phân quyền cho giao diện có sẵn.

## Yêu cầu
- Node.js 18+
- MongoDB đang chạy (local `mongodb://127.0.0.1:27017` hoặc MongoDB Atlas)

## Cài đặt & chạy
1. Cài thư viện:
   ```
   npm install
   ```
2. Tạo file `.env` từ mẫu:
   ```
   copy .env.example .env
   ```
   Sửa `JWT_SECRET` thành một chuỗi ngẫu nhiên dài và kiểm tra `MONGODB_URI`.
3. Chạy server:
   ```
   npm start
   ```
   Server chạy tại `http://localhost:3000`.

> Không commit `node_modules/` hoặc `.env` (đã có trong `.gitignore`).

## Cấu trúc database
| Entity   | Trường |
|----------|--------|
| User     | id, fullName, age, gender, email (unique), passwordHash, avatarUrl, type (`normal` / `admin`) |
| Category | id, name (unique) |
| Product  | id, categoryId (ref Category), name, quantity, price |

`passwordHash` không bao giờ được trả về trong response.

## API

Tất cả route có tiền tố `/api/v1`. Route có 🔒 yêu cầu header `Authorization: Bearer <token>`.

| Method | Route | Quyền | Mô tả |
|--------|-------|-------|-------|
| POST | `/auth/register` | Public | Tạo tài khoản (`type`: normal/admin). Email trùng → 409 |
| POST | `/auth/login` | Public | Xác thực, trả về JWT (payload: `id`, `type`) |
| GET | `/auth/me` | 🔒 | Thông tin user đang đăng nhập |
| PUT | `/users/me` | 🔒 | Cập nhật fullName, age, gender của chính mình |
| POST | `/users/me/avatar` | 🔒 | Upload avatar (multipart/form-data, field `avatar`, JPG/PNG/WEBP, ≤ 2 MB) |
| GET | `/categories` | 🔒 | Danh sách category |
| POST | `/categories` | 🔒 admin | Tạo category |
| PUT | `/categories/:id` | 🔒 admin | Sửa category |
| DELETE | `/categories/:id` | 🔒 admin | Xoá category |
| GET | `/products?categoryId=` | 🔒 | Danh sách product (lọc theo category tùy chọn) |
| POST | `/products` | 🔒 admin | Tạo product |
| PUT | `/products/:id` | 🔒 admin | Sửa product |
| DELETE | `/products/:id` | 🔒 admin | Xoá product |

### Mã lỗi
- `401` – thiếu token, token sai hoặc hết hạn
- `403` – user `normal` gọi route admin
- `400` – dữ liệu không hợp lệ
- `404` – không tìm thấy tài nguyên
- `409` – trùng email / trùng tên category

### Ví dụ
Đăng ký admin:
```
POST /api/v1/auth/register
{ "fullName": "admin", "age": 23, "gender": "Male", "email": "admin@gmail.com", "password": "123456", "type": "admin" }
```

Đăng nhập:
```
POST /api/v1/auth/login
{ "email": "admin@gmail.com", "password": "123456" }
```
→ `{ "success": true, "token": "...", "data": { ... } }`

## Kiểm tra nhanh
- Đăng nhập bằng user `normal`, thử `POST /products` → nhận `403`.
- Không gửi token → `401`.
- Xem token trong DevTools > Application > Local Storage, hoặc header `Authorization` của request.
