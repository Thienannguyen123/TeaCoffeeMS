// models/ChiTietDonHang.js
// Model Chi tiết đơn hàng (maCTDH, maDH, maSP, soLuong, ghiChu)
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ChiTietDonHang = sequelize.define("ChiTietDonHang", {
  maCTDH: { type: DataTypes.INTEGER, primaryKey: true },
  maDH: { type: DataTypes.INTEGER, allowNull: false }, // FK -> DonHang
  maSP: { type: DataTypes.INTEGER, allowNull: false }, // FK -> SanPham
  soLuong: { type: DataTypes.INTEGER, defaultValue: 1 },
  ghiChu: { type: DataTypes.STRING }
}, {
  tableName: "ChiTietDonHang",
  timestamps: false
});

module.exports = ChiTietDonHang;
