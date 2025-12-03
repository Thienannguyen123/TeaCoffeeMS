// routes/table.routes.js
const express = require("express");
const router = express.Router();
const tableCtrl = require("../controllers/table.controller");
const { authenticate, authorizeAdmin, authorizeAnyStaff } = require("../middleware/auth.middleware");

// Lấy danh sách bàn (cần login)
router.get("/", authenticate, tableCtrl.getAllTables);

// Admin: CRUD
router.post("/", authenticate, authorizeAdmin, tableCtrl.createTable);
router.put("/:id", authenticate, authorizeAdmin, tableCtrl.updateTable);
router.delete("/:id", authenticate, authorizeAdmin, tableCtrl.deleteTable);

// NV: cập nhật trạng thái bàn
router.patch("/:id/status", authenticate, authorizeAnyStaff, tableCtrl.updateTableStatus);
/*  */
module.exports = router;
