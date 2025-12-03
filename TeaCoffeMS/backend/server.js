require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { sequelize, ChamCong, LichLamViec } = require("./models");

// =======================
// 1. IMPORT ROUTES
// =======================
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
const salaryRoutes = require("./routes/salary.routes.js"); // Route lương mới thêm

const app = express();
app.use(cors());
app.use(express.json());

// =======================
// 2. MOUNT ROUTES
// =======================
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
app.use("/api/salary", salaryRoutes); // API lương

// Healthcheck
app.get("/", (req, res) => res.send("TeaCoffeeMS Backend (MSSQL) is running"));

// ==================================================================
// 3. CRON JOB: TỰ ĐỘNG QUÉT VÀ CHỐT CÔNG (AUTO-CHECKOUT)
// ==================================================================
cron.schedule('*/15 * * * *', async () => {
    try {
        const todayStr = new Date().toLocaleDateString('en-CA'); 
        
        // A. Tìm tất cả nhân viên chưa Check-out
        const openingRecords = await ChamCong.findAll({
            where: { gioRa: null, ngay: todayStr }
        });

        for (const record of openingRecords) {
            // B. Lấy lịch làm việc
            const shift = await LichLamViec.findOne({
                where: { maNV: record.maNV, ngayLamViec: todayStr }
            });

            if (shift && shift.gioKetThuc) {
                const shiftEnd = new Date(shift.gioKetThuc);
                const maxTime = new Date();
                maxTime.setHours(shiftEnd.getHours() + 4, shiftEnd.getMinutes(), 0);

                const now = new Date();

                if (now > maxTime) {
                    console.log(`>>> [Auto-Checkout] Đã đóng ca cho NV: ${record.maNV} lúc ${maxTime.toLocaleTimeString()}`);
                    record.gioRa = maxTime;
                    record.trangThai = "Tăng ca (Auto)";
                    record.ghiChu = "Hệ thống tự động chốt (Quá 4h tăng ca)";
                    await record.save();
                }
            }
        }
    } catch (e) {
        console.error("❌ Lỗi Cron Job:", e.message);
    }
});

// =======================
// 4. START SERVER
// =======================
(async () => {
  try {
    await sequelize.sync({ alter: false, force: false });
    console.log("✅ Database synchronized");

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