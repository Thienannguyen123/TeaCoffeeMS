// models/DonHang.js
// Model Đơn hàng (maDH, maNV, maBan, tongTien, trangThai, thoiGian)
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const DonHang = sequelize.define("DonHang", {
  maDH: { type: DataTypes.INTEGER, primaryKey: true},
  maNV: { type: DataTypes.INTEGER, allowNull: true }, // FK -> NhanVien
  maBan: { type: DataTypes.INTEGER, allowNull: true }, // FK -> Ban
  tongTien: { type: DataTypes.FLOAT, defaultValue: 0 },
  trangThai: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "DangXuLy", 
    validate: { isIn: [["Huy", "DaThanhToan", "DangXuLy"]] }
  },
  thoiGian: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: "DonHang",
  timestamps: false
});

module.exports = DonHang;
