# Tài liệu Đặc tả Hệ thống Đăng ký Học phần và Thu học phí

## 1. Tổng quan hệ thống
Hệ thống mô phỏng quy trình từ lúc người dùng đăng ký tài khoản, giảng viên tạo lớp, sinh viên đăng ký môn học cho đến bước thanh toán học phí và xuất thời khóa biểu.

---

## 2. Các Stakeholders (Tác nhân)
Hệ thống được thiết kế theo mô hình kế thừa từ lớp cha là **Guest**.

- **Guest (Khách):** Người dùng chưa định danh.
- **Student (Sinh viên):** Người học, thực hiện đăng ký và đóng tiền.
- **Teacher (Giảng viên):** Người trực tiếp giảng dạy và quản lý lớp.
- **Admin (Quản trị):** Điều phối toàn bộ trạng thái hệ thống và xác nhận tài chính.

---

## 3. Danh sách Use Cases theo nhóm quyền

### A. Nhóm Guest (Lớp mẹ)
- **Đăng ký thông tin:** Khách tạo tài khoản để tham gia vào hệ thống (phân loại thành Student hoặc Teacher).

### B. Nhóm Student
- **Đăng ký môn học:** Chọn các lớp học đang mở để ghi danh.
- **Lọc môn học:** Tìm kiếm môn học nhanh dựa trên gợi ý (theo khoa, số tín chỉ, môn tiên quyết).
- **Hủy đăng ký:** Rút tên khỏi lớp học đã chọn (nếu hệ thống còn cho phép).
- **Nộp học phí:** Gửi yêu cầu xác nhận đã thanh toán học phí cho các môn đã đăng ký.
- **Xuất thời khóa biểu:** Xem lịch học cá nhân dựa trên các lớp đã đăng ký thành công.

### C. Nhóm Teacher
- **Tạo lớp học:** Mở lớp mới dựa trên danh mục môn học (`Courses`) có sẵn.
- **Cập nhật thông tin lớp:** Chỉnh sửa thời gian, ngày học hoặc phòng học.
- **Xóa lớp học:** Hủy lớp nếu không đủ điều kiện mở lớp.
- **Xuất thời khóa biểu:** Xem lịch dạy cá nhân theo tuần.

### D. Nhóm Admin
- **Xác nhận nộp học phí:** Kiểm tra và xác nhận trạng thái thanh toán cho sinh viên (chuyển trạng thái từ `enrolled` sang `payed`).
- **Cập nhật trạng thái hệ thống:** Điều khiển giai đoạn vận hành (Ví dụ: Chốt đăng ký, Mở cổng nộp tiền).

---


