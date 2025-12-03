// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const authCtrl = require("../controllers/auth.controller");

// POST /api/auth/login
router.post("/login", authCtrl.login);
router.post("/google", authCtrl.googleLogin);

module.exports = router;
