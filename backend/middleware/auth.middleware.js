// middleware/auth.middleware.js
// Middleware để kiểm tra JWT và phân quyền (admin / nhanvien)
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

// Kiểm tra token Authorization: "Bearer <token>"
const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (!authHeader) return res.status(401).json({ message: "Thiếu token" });

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(400).json({ message: "Token không đúng định dạng" });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // decoded chứa: { maNV, vaiTro, tenNV, iat, exp }
    req.user = decoded;
    next();
  } catch (err) {
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
  if (!req.user) return res.status(401).json({ message: "Chưa xác thực" });
  // nếu cần kiểm tra vaiTro: admin hoặc nhanvien
  if (!["admin", "QuanLy" ,"NhanVien"].includes(req.user.vaiTro)) return res.status(403).json({ message: "Không có quyền" });
  next();
};

module.exports = { authenticate, authorizeAdmin, authorizeAnyStaff, JWT_SECRET };
