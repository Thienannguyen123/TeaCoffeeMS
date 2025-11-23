const express = require("express");
const router = express.Router();
const userCtrl = require("../controllers/user.controller");
const { authenticate, authorizeAdmin } = require("../middleware/auth.middleware");

// Admin quản lý user
router.post("/", authenticate, authorizeAdmin, userCtrl.createUser);
router.get("/", authenticate, authorizeAdmin, userCtrl.getAllUsers);
router.get("/me", authenticate, userCtrl.getProfile);
// ✅ Đặt lại mật khẩu phải qua middleware admin
router.put("/reset-password/:id", authenticate, authorizeAdmin, userCtrl.resetPassword);
// Đổi mật khẩu (self)
router.put("/change-password", authenticate, userCtrl.changePassword); // Sửa tại đây

router.put("/:id", authenticate, authorizeAdmin, userCtrl.updateUser);
router.delete("/:id", authenticate, authorizeAdmin, userCtrl.deleteUser);



module.exports = router;
