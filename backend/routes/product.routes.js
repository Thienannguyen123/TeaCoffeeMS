// routes/product.routes.js
const express = require("express");
const router = express.Router();
const productCtrl = require("../controllers/product.controller");
const { authenticate, authorizeAdmin } = require("../middleware/auth.middleware");

// Lấy danh sách (cần login)
router.get("/", authenticate, productCtrl.getAllProducts);
router.get("/:id", authenticate, productCtrl.getProductById);

// CRUD (Admin)
router.post("/", authenticate, authorizeAdmin, productCtrl.createProduct);
router.put("/:id", authenticate, authorizeAdmin, productCtrl.updateProduct);
router.delete("/:id", authenticate, authorizeAdmin, productCtrl.deleteProduct);

module.exports = router;
