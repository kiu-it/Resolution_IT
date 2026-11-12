# KiuTech

Website giới thiệu dịch vụ sửa chữa máy tính, lắp đặt PC, hạ tầng mạng, camera an ninh và hỗ trợ IT.

## Yêu cầu

- Node.js 20 trở lên
- Chạy `npm install` để cài dependency gửi email

## Chạy website

```bash
npm start
```

Mở [http://localhost:3000](http://localhost:3000). Trong lúc phát triển, chạy `npm run dev` để tự khởi động lại máy chủ khi file thay đổi.

Trước khi xuất bản, hãy thay số điện thoại, email, giờ hỗ trợ và tên thương hiệu mẫu trong `public/index.html` bằng thông tin đã xác nhận của doanh nghiệp.

## Cấu hình gửi email

Mỗi yêu cầu hợp lệ được gửi tới `dungocanh061003@gmail.com` và gửi bản sao tới email người gửi qua Gmail SMTP. Email người gửi là bắt buộc. Khi gửi gặp lỗi kết nối tạm thời, máy chủ tự thử tối đa 3 lần với thời gian chờ tăng dần; nếu vẫn thất bại, yêu cầu được lưu lại và website báo gửi email chưa thành công. Trước khi chạy website, thiết lập:

- `SMTP_USER`: tài khoản Gmail dùng để gửi thư.
- `SMTP_APP_PASSWORD`: App Password của tài khoản Gmail đó (không dùng mật khẩu đăng nhập thông thường).

Ví dụ trong PowerShell:

```powershell
$env:SMTP_USER = "your-gmail@gmail.com"
$env:SMTP_APP_PASSWORD = "your-google-app-password"
npm start
```

Tạo App Password trong tài khoản Google đã bật xác minh 2 bước. Không đưa App Password vào mã nguồn hoặc chia sẻ công khai. Email gửi đi gồm mã yêu cầu, dịch vụ, họ tên, số điện thoại, email khách hàng (nếu có), thời gian gửi và mô tả nhu cầu.

Nếu triển khai trên Vercel, thêm `SMTP_USER` và `SMTP_APP_PASSWORD` trong **Project Settings → Environment Variables** cho môi trường đang chạy, sau đó deploy lại. Hệ thống lưu file tạm trong `/tmp` trên Vercel vì thư mục mã nguồn không ghi được; file này không bền vững qua các lần chạy. Đặt `DATA_FILE` trỏ tới kho lưu trữ bền vững nếu cần lưu yêu cầu lâu dài.

## API

- `GET /api/services` — danh sách dịch vụ.
- `POST /api/requests` — tiếp nhận yêu cầu tư vấn dạng JSON.

Ví dụ payload:

```json
{
  "name": "Nguyễn Minh",
  "phone": "0901 234 567",
  "email": "anhdn@itss.vn",
  "serviceId": "network-infrastructure",
  "message": "Cần khảo sát mạng văn phòng."
}
```

Yêu cầu hợp lệ được lưu nối tiếp vào `data/requests.jsonl`. Có thể đặt biến môi trường `DATA_FILE` để chọn đường dẫn lưu khác. Dữ liệu demo được lưu cục bộ; trước khi đưa lên production, hãy thay thế bằng cơ sở dữ liệu có kiểm soát truy cập, sao lưu và thời hạn lưu phù hợp.

## Kiểm thử

```bash
npm test
```
