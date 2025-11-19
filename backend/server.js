// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");

// Routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const productRoutes = require("./routes/product.routes");
const tableRoutes = require("./routes/table.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");
const reportRoutes = require("./routes/report.routes");
const leaveRoutes = require("./routes/leave.routes.js");
const attendanceRoutes = require("./routes/attendance.routes.js");
const shiftRoutes = require("./routes/shift.routes.js");


const app = express();
app.use(cors());
app.use(express.json());

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/shifts", shiftRoutes);



// Healthcheck
app.get("/", (req, res) => res.send("TeaCoffeeMS Backend (MSSQL) is running"));

// Đồng bộ DB rồi start server
(async () => {
  try {
    // Chú ý production: không dùng sync({ alter: true }) tự động
    await sequelize.sync({ alter: false });
    console.log("✅ Database synchronized");

    // Nếu muốn tự động seed admin khi SEED_ADMIN=true
    if (process.env.SEED_ADMIN === "true") {
      try {
        console.log("SEED_ADMIN=true -> chạy seed/admin.seed.js");
        require("./seed/admin.seed");
      } catch (e) {
        console.warn("Không thể chạy seed:", e.message);
      }
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server chạy trên cổng ${PORT}`));
  } catch (err) {
    console.error("❌ Lỗi khi sync DB hoặc start server:", err);
  }
})();
