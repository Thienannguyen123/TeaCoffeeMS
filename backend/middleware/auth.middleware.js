// middleware/auth.middleware.js
// Middleware để kiểm tra JWT và phân quyền (admin / nhanvien)
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

// Kiểm tra token Authorization: "Bearer <token>"
// middleware/auth.middleware.js - HÀM AUTHENTICATE ĐÃ SỬA
const authenticate = (req, res, next) => {
 const authHeader = req.headers["authorization"] || req.headers["Authorization"];

console.log("================== DEBUG AUTH ==================");
console.log("Giá trị Header Authorization:", authHeader); // Log 1: Kiểm tra giá trị header
 if (!authHeader) {
console.log("Lỗi: Thiếu token (401)");
 return res.status(401).json({ message: "Thiếu token" });
 }

 const parts = authHeader.split(" ");
 
 // Kiểm tra lỗi định dạng: PHẢI CÓ 2 phần và phần đầu là "Bearer" (so sánh chữ thường)
 if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") { 
 console.log("Lỗi: Token không đúng định dạng (400)");
 return res.status(400).json({ message: "Token không đúng định dạng" });
 }

 const token = parts[1];
try {
   // Khóa bí mật đã đồng bộ ở auth.controller.js (change_this_secret)
   const decoded = jwt.verify(token, JWT_SECRET);
   req.user = decoded;
   console.log("Token xác thực thành công. maNV:", decoded.maNV);
   next(); // Chuyển request đến controller
   } catch (err) {
   // Log 2: Log lỗi chi tiết nếu jwt.verify thất bại
     console.error("========================================");
      console.error("LỖI XÁC THỰC TOKEN (401):", err.message);
       console.error("========================================");
       return res.status(401).json({ message: "Token không hợp lệ hoặc hết hạn" });
   }
};

// Chỉ admin được phép
const authorizeAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Chưa xác thực" });
  if (req.user.vaiTro !== "admin" && req.user.vaiTro !== "QuanLy") {
  return res.status(403).json({ message: "Chỉ admin hoặc quản lý được truy cập" });
}
  next();
};

// Admin hoặc nhân viên (bất kỳ tài khoản hợp lệ)
const authorizeAnyStaff = (req, res, next) => {
 // Thêm log để kiểm tra vai trò tại đây
 console.log("DEBUG AUTHORIZE: Kiểm tra vai trò:", req.user.vaiTro);
 
 if (!req.user) {
 console.log("Lỗi: authorizeAnyStaff bị gọi mà không có req.user");
 return res.status(401).json({ message: "Chưa xác thực" });
 }

 // Chuyển vai trò sang chữ thường để so sánh
const userRole = req.user.vaiTro ? req.user.vaiTro.toLowerCase() : '';

// Kiểm tra vai trò đã chuyển đổi
 if (!["admin", "quanly", "nhanvien"].includes(userRole)) { // So sánh với chữ thường
 console.log(`Forbidden: Vai trò [${userRole}] không được phép.`);
return res.status(403).json({ message: "Không có quyền" });
 }
 
 console.log("DEBUG AUTHORIZE: Vai trò hợp lệ. Chuyển tiếp đến Controller.");
 next(); // Hợp lệ, chuyển tiếp
};

module.exports = { authenticate, authorizeAdmin, authorizeAnyStaff, JWT_SECRET };
