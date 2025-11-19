// routes/user.routes.js
const express = require("express");
const router = express.Router();
const userCtrl = require("../controllers/user.controller");
const { authenticate, authorizeAdmin } = require("../middleware/auth.middleware");

// Admin quản lý user
router.post("/", authenticate, authorizeAdmin, userCtrl.createUser);
router.get("/", authenticate, authorizeAdmin, userCtrl.getAllUsers);
router.get("/me", authenticate, userCtrl.getProfile);
router.put("/:id", authenticate, authorizeAdmin, userCtrl.updateUser);
router.delete("/:id", authenticate, authorizeAdmin, userCtrl.deleteUser);

module.exports = router;
