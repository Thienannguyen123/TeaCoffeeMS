// routes/attendance.routes.js
const express = require('express');
const router = express.Router();
const attendanceCtrl = require("../controllers/attendance.controller"); // Gọi controller
const { authenticate, authorizeAdmin, authorizeAnyStaff } = require("../middleware/auth.middleware");

// ADMIN: Lấy tất cả dữ liệu chấm công
router.get('/', authenticate, authorizeAdmin, attendanceCtrl.getAttendanceForAdmin);

// ADMIN: Xóa một mục chấm công
router.delete('/:id', authenticate, authorizeAdmin, attendanceCtrl.deleteAttendance);

// ADMIN: Sửa một mục chấm công
router.put('/:id', authenticate, authorizeAdmin, attendanceCtrl.updateAttendance);

// STAFF: Check-in / Check-out 
router.post('/toggle', authenticate, authorizeAnyStaff, attendanceCtrl.toggleCheckIn);

// STAFF: Lấy trạng thái check-in hiện tại 
router.get('/status', authenticate, authorizeAnyStaff, attendanceCtrl.getCheckInStatus);

module.exports = router;