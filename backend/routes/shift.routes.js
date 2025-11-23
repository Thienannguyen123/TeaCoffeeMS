// routes/shift.routes.js
const express = require("express");
const router = express.Router();
const shiftCtrl = require("../controllers/shift.controller");
const { authenticate, authorizeAdmin, authorizeAnyStaff } = require("../middleware/auth.middleware");

router.get("/", authenticate, authorizeAdmin, shiftCtrl.getAllShifts);
// 1. Tạo ca mới (Vào Ca)
// CŨ: router.post("/", authenticate, authorizeAdmin, shiftCtrl.assignShift);
// MỚI: Đổi authorizeAdmin -> authorizeAnyStaff (Để nhân viên cũng gọi được)
router.post("/", authenticate, authorizeAnyStaff, shiftCtrl.assignShift);

// 2. Xem ca làm việc của tôi
router.get("/my", authenticate, authorizeAnyStaff, shiftCtrl.getMyShifts);

// 3. (MỚI) Cập nhật ca (Tan Ca / Check-out)
// Cho phép nhân viên gọi PUT vào /api/shifts/:id
router.put("/:id", authenticate, authorizeAnyStaff, shiftCtrl.updateShift);

module.exports = router;