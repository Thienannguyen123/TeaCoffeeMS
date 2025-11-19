// routes/payment.routes.js
const express = require("express");
const router = express.Router();
const paymentCtrl = require("../controllers/payment.controller");
const { authenticate, authorizeAnyStaff } = require("../middleware/auth.middleware");

// Định nghĩa API: Khi có yêu cầu POST đến /api/payments/
router.post("/", authenticate, authorizeAnyStaff, paymentCtrl.createPayment);

// (Bạn có thể thêm các route GET để xem lịch sử thanh toán sau)

module.exports = router;