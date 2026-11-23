0# Exercise 4 – Bug report (Task Manager API)

Chỉ sửa backend: [`server.js`](server.js). Frontend (`index.html`, `app.js`, `style.css`) giữ nguyên.

| # | Triệu chứng trên UI | Bằng chứng trong DevTools / terminal | Nguyên nhân gốc | Cách sửa |
|---|---|---|---|---|
| 1 | Trang hiện "Cannot reach the API. Open DevTools…", danh sách trống | Console: `Access to fetch at 'http://localhost:5002/api/tasks' from origin 'http://127.0.0.1:5500' has been blocked by CORS policy: … 'Access-Control-Allow-Origin' header has a value 'http://localhost:3000'` | `cors({ origin: 'http://localhost:3000' })` hard-code một origin không bao giờ dùng tới, trong khi UI chạy ở `127.0.0.1:5500` | Đổi thành `origin: true` (phản chiếu origin của request) để mọi origin của UI đều gọi được |
| 2 | Sau khi sửa #1: tick/untick, sửa, xóa đều thất bại | Network có request `OPTIONS /api/tasks/2` trả về header `Access-Control-Allow-Methods: GET,POST`; Console báo method `PUT`/`DELETE` không được phép | `methods: ['GET', 'POST']` thiếu `PUT`, `DELETE`, `OPTIONS` nên preflight bị từ chối | Thêm đủ `methods: ['GET','POST','PUT','DELETE','OPTIONS']` và `allowedHeaders: ['Content-Type','Authorization']` |
| 3 | Bấm Add: hiện lỗi 500, không thêm được task | Network: `POST /api/tasks` → `500`; terminal: `TypeError: Cannot destructure property 'title' of 'req.body' as it is undefined` | Thiếu middleware `express.json()`, nên body JSON không được parse | Thêm `app.use(express.json());` |
| 4 | Task hiện ra nhưng **tên task trống**, chỉ có `#1 · created …` | Network → `GET /api/tasks` → Response: `{"id":1,"name":"Read the Express routing docs", …}` | `toDto()` map `title` thành `name`, trong khi UI đọc `task.title` | Đổi DTO trả về `title` (khớp `Task = { id, title, done, createdAt }`) |
| 5 | Bấm filter **Done**: danh sách quay vòng "Loading…" mãi, request treo ở *(pending)* | Network: `GET /api/tasks?status=done` ở trạng thái *(pending)*, không có status code; terminal in `Found 1 completed task(s)` | Nhánh `status === 'done'` chỉ `console.log` rồi rơi khỏi hàm, **không gọi `res.json()`** → request không bao giờ kết thúc | `return res.json({ success: true, data: tasks.filter(t => t.done).map(toDto) });` |
| 6 | Thẻ thống kê bị **đảo số**: ACTIVE hiện số task đã xong, DONE hiện số task chưa xong | Network → `GET /api/tasks/stats` → `{"total":4,"active":1,"done":3}` (thực tế 1 done, 3 active) | Điều kiện lọc bị ngược: `done` đếm `!t.done`, `active` đếm `t.done` | `done = tasks.filter(t => t.done).length; active = total - done;` |
| 7 | Bấm Add khi ô nhập trống: hiện lỗi 500 thay vì thông báo "Title is required" | Network: `POST /api/tasks` → `500`; terminal: `TypeError: Cannot read properties of undefined (reading 'trim')` | Thiếu `return` sau `res.status(400)…` nên code chạy tiếp và gọi `title.trim()` trên `undefined` | Thêm `return` trước `res.status(400)` và validate `typeof req.body.title === 'string'` sau khi `trim()` |
| 8 | Bấm Edit rồi OK: luôn báo "Task not found" dù task tồn tại | Network: `PUT /api/tasks/2` → `404 {"success":false,"message":"Task not found"}` | So sánh sai kiểu: `t.id === req.params.id` (`number` vs `string`) luôn `false` | `const id = Number(req.params.id);` rồi `t.id === id` |
| 9 | Untick một task đã xong: không bỏ tick được, task vẫn ở trạng thái done | Network: `PUT /api/tasks/1` body `{"done":false}` → Response vẫn `"done": true` | `task.done = req.body.done || task.done` — `false` là giá trị falsy nên bị bỏ qua; tương tự `title` không validate | Dùng `hasOwnProperty` + gán trực tiếp `task.done = req.body.done`, validate kiểu `boolean`; title rỗng → `400` |
| 10 | Xóa task #2 nhưng **task khác bị mất**, task #2 vẫn còn | Network: `DELETE /api/tasks/2` → `200`; danh sách sau đó thiếu task #3 | `tasks.splice(id, 1)` dùng `id` làm **chỉ số mảng**, không phải vị trí thật | `const index = tasks.findIndex(t => t.id === id); tasks.splice(index, 1);` (không tìm thấy → `404`) |

## Kiểm chứng sau khi sửa

```
GET    /api/tasks                    → 200 { success:true, data: Task[] }        (title đúng)
GET    /api/tasks?status=active      → 200, chỉ task done:false
GET    /api/tasks?status=done        → 200, chỉ task done:true
GET    /api/tasks/stats              → 200 { total:4, active:3, done:1 }
POST   /api/tasks {title:"   "}      → 400 { success:false, message:"Title is required" }
POST   /api/tasks {title:"API smoke test"} → 201 { success:true, data:{ id:5, … } }
PUT    /api/tasks/5 {done:true}      → 200, done:true
PUT    /api/tasks/5 {done:false}     → 200, done:false   (bug #9 đã hết)
DELETE /api/tasks/5                  → 200 { success:true, message:"Task deleted" }
OPTIONS /api/tasks (Origin 127.0.0.1:5500) → 204, Allow-Origin: http://127.0.0.1:5500, Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
```

## Cách chạy

```bash
cd in_class/ex4
npm install
npm start
```

Mở `in_class/ex4/index.html` bằng Live Server (ví dụ `http://127.0.0.1:5500/in_class/ex4/index.html`).
Dữ liệu lưu trong bộ nhớ nên restart server sẽ reset về 4 task mẫu.
