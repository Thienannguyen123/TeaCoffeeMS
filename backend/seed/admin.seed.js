// seed/admin.seed.js
// Script seed: tạo tài khoản admin, vài sản phẩm và bàn mẫu
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize, NhanVien, SanPham, Ban } = require("../models");

async function seed() {
  try {
    await sequelize.sync({ alter: true });

    // Tạo admin nếu chưa có
    const adminTk = "admin";
    let admin = await NhanVien.findOne({ where: { taiKhoan: adminTk } });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash("admin123", salt);
      admin = await NhanVien.create({
        tenNV: "Quản lý",
        taiKhoan: adminTk,
        matKhau: hashed,
        vaiTro: "admin",
        caLamViec: "sáng"
      });
      console.log("Tạo user admin:", admin.taiKhoan, "mật khẩu: admin123");
    } else {
      console.log("Admin đã tồn tại:", admin.taiKhoan);
    }

    // Tạo vài sản phẩm mẫu nếu chưa có
    const samples = [
      { tenSP: "Cà phê sữa", gia: 35000, loai: "ca_phe" },
      { tenSP: "Trà đào", gia: 30000, loai: "tra" },
      { tenSP: "Bánh mì", gia: 25000, loai: "do_an" }
    ];
    for (const s of samples) {
      const found = await SanPham.findOne({ where: { tenSP: s.tenSP } });
      if (!found) {
        await SanPham.create(s);
        console.log("Tạo sản phẩm mẫu:", s.tenSP);
      }
    }

    // Tạo bàn mẫu
    for (let i = 1; i <= 8; i++) {
      const name = `Bàn ${i}`;
      const b = await Ban.findOne({ where: { tenBan: name } });
      if (!b) {
        await Ban.create({ tenBan: name, trangThai: "trong" });
      }
    }

    console.log("Seed hoàn tất");
    process.exit(0);
  } catch (err) {
    console.error("Seed lỗi:", err);
    process.exit(1);
  }
}

seed();
