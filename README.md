# Ứng dụng Cloud Storage

Đây là một nền tảng lưu trữ đám mây (Cloud Storage) full-stack cho phép người dùng tải lên, quản lý và chia sẻ tệp một cách an toàn. Hệ thống hỗ trợ đăng nhập bằng Google, thanh toán qua Stripe và được container hóa bằng Docker.

---

## Công nghệ sử dụng

### Frontend
- Next.js (React Framework)
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express.js (RESTful API)

### Cơ sở dữ liệu
- PostgreSQL

### Xác thực
- Google OAuth 2.0

### Thanh toán
- Stripe

### DevOps
- Docker
- Docker Compose

---

## Tính năng

- Đăng nhập bằng Google
- Upload, download, xoá file
- Quản lý dung lượng lưu trữ
- Thanh toán gói nâng cấp (Stripe)
- Dashboard người dùng
- Tìm kiếm & lọc file
- Lịch sử thanh toán
- Quản lý hồ sơ cá nhân

---

## Cấu trúc dự án

```
cloud-storage-app/
│
├── backend/               # API Node.js + Express
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   ├── services/
│   └── app.js
│
├── frontend/              # Next.js App
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── styles/
│
├── docker/                # Cấu hình Docker
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── docker-compose.yml
│
├── .env
└── README.md
```

---

## Biến môi trường (.env)

Tạo file `.env` ở thư mục gốc:

```
# Backend
PORT=5000
DATABASE_URL=postgresql://user:password@db:5432/cloud_storage

# JWT
JWT_SECRET=your_secret_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Frontend
NEXT_PUBLIC_API_URL=http://localhost
```

---

## Chạy bằng Docker

```
docker-compose up --build
```

Sau khi chạy:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## Quy trình thanh toán (Stripe)

1. Người dùng chọn gói nâng cấp
2. Frontend gọi API backend để tạo Stripe Checkout Session
3. Chuyển hướng sang trang thanh toán của Stripe
4. Stripe gửi webhook về backend
5. Backend cập nhật trạng thái gói cho người dùng

---

## Quy trình đăng nhập Google

1. Người dùng chọn "Login with Google"
2. Chuyển hướng tới Google OAuth
3. Backend xác thực token
4. Tạo hoặc lấy thông tin user từ database
5. Trả về JWT để xác thực phiên

---

## Chạy môi trường phát triển

### Backend

```
cd backend
npm install
node server.js
```

### Frontend

```
cd frontend
npm install
npm run dev
```

---

## Hướng phát triển

- Chia sẻ file qua link public
- Phân loại file bằng AI
- Ứng dụng mobile
- Mã hoá end-to-end
