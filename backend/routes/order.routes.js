// routes/order.routes.js
const express = require("express");
const router = express.Router();
const orderCtrl = require("../controllers/order.controller");
const { authenticate, authorizeAnyStaff, authorizeAdmin } = require("../middleware/auth.middleware");

// NV tạo đơn, thêm/xoá/cập nhật item
router.post("/", authenticate, authorizeAnyStaff, orderCtrl.createOrder);
router.post("/:id/items", authenticate, authorizeAnyStaff, orderCtrl.addItem);
router.put("/items/:maCTDH", authenticate, authorizeAnyStaff, orderCtrl.updateItem);
router.delete("/items/:maCTDH", authenticate, authorizeAnyStaff, orderCtrl.removeItem);

// Cập nhật trạng thái đơn hàng
router.put("/:id", authenticate, authorizeAnyStaff, orderCtrl.updateOrderStatus);

// Lấy đơn
router.get("/", authenticate, orderCtrl.getOrders); // admin or nv: nếu nv chỉ thấy đơn của mình
router.get("/:id", authenticate, orderCtrl.getOrderById);

module.exports = router;
