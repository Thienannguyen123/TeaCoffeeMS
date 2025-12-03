const express = require("express");
const router = express.Router();
const controller = require("../controllers/salary.controller");

// Import middleware (Đảm bảo đúng đường dẫn và tên hàm)
const { authenticate, authorizeAdmin } = require("../middleware/auth.middleware");

// ===============================================================
// 1. ROUTE CHO ADMIN (Xem báo cáo tổng hợp)
// URL: /api/salary?month=...&year=...
// ===============================================================
router.get("/", [authenticate, authorizeAdmin], controller.getSalaryReport);


// ===============================================================
// 2. ROUTE CHO NHÂN VIÊN (Xem lương của chính mình)
// URL: /api/salary/me?month=...&year=...
// ===============================================================
router.get("/me", [authenticate], controller.getMySalary);

module.exports = router;