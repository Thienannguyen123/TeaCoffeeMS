// models/NhanVien.js
// Model Nhân Viên (maNV, tenNV, taiKhoan, matKhau, vaiTro, caLamViec)
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const NhanVien = sequelize.define("NhanVien", {
  maNV: { type: DataTypes.INTEGER, primaryKey: true },
  tenNV: { type: DataTypes.STRING, allowNull: false },
  taiKhoan: { type: DataTypes.STRING, allowNull: false },
  matKhau: { type: DataTypes.STRING, allowNull: false },
  vaiTro: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "NhanVien",
    validate: { isIn: [["admin", "NhanVien", "QuanLy"]] }
  },
  caLamViec: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: "NhanVien",
  timestamps: false
});

module.exports = NhanVien;
