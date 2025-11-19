// routes/leave.routes.js
const express = require("express");
const router = express.Router();
const leaveCtrl = require("../controllers/leave.controller");
const { authenticate, authorizeAdmin, authorizeAnyStaff } = require("../middleware/auth.middleware");

// === API CHO ADMIN ===
// Admin: Lấy TẤT CẢ đơn
router.get("/", authenticate, authorizeAdmin, leaveCtrl.getLeavesForAdmin);
// Admin: Duyệt đơn
router.put("/:id/approve", authenticate, authorizeAdmin, leaveCtrl.approveLeave);
// Admin: Từ chối đơn
router.put("/:id/reject", authenticate, authorizeAdmin, leaveCtrl.rejectLeave);


// === API CHO NHÂN VIÊN ===
// Staff: Nộp đơn mới
router.post("/", authenticate, authorizeAnyStaff, leaveCtrl.createLeave);
// Staff: Lấy lịch sử CỦA TÔI
router.get("/my", authenticate, authorizeAnyStaff, leaveCtrl.getMyLeaves);

module.exports = router;