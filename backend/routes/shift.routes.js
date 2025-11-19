// routes/shift.routes.js
const express = require("express");
const router = express.Router();
const shiftCtrl = require("../controllers/shift.controller");
// Lấy middleware từ file khác (giả sử là auth.middleware.js)
const { authenticate, authorizeAdmin, authorizeAnyStaff } = require("../middleware/auth.middleware");

// Admin: Xếp ca mới cho nhân viên
router.post("/", authenticate, authorizeAdmin, shiftCtrl.assignShift);

// Staff: Xem ca làm việc của tôi
router.get("/my", authenticate, authorizeAnyStaff, shiftCtrl.getMyShifts);

module.exports = router;