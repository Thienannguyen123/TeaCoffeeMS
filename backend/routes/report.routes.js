// routes/report.routes.js
const express = require("express");
const router = express.Router();
const reportCtrl = require("../controllers/report.controller");
const { authenticate, authorizeAdmin } = require("../middleware/auth.middleware");

// Chỉ admin xem báo cáo
router.get("/revenue", authenticate, authorizeAdmin, reportCtrl.getRevenueByDate);
router.get("/top-products", authenticate, authorizeAdmin, reportCtrl.getTopProducts);

module.exports = router;
