// models/ThanhToan.js
// Model Thanh toán (maTT, maDH, soTien, phuongThuc, thoiGian)
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ThanhToan = sequelize.define("ThanhToan", {
  maTT: { type: DataTypes.INTEGER, primaryKey: true },
  maDH: { type: DataTypes.INTEGER },
  soTien: { type: DataTypes.DECIMAL(18, 0) }, 
  phuongThuc: { type: DataTypes.STRING },
  thoiGian: { type: DataTypes.DATE } 
}, {
  tableName: "ThanhToan",
  timestamps: false 
});

module.exports = ThanhToan;