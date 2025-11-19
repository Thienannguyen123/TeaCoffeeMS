// models/SanPham.js
// Model Sản phẩm (maSP, tenSP, gia, loai)
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SanPham = sequelize.define("SanPham", {
  maSP: { type: DataTypes.INTEGER,allowNull: false, primaryKey: true },
  tenSP: { type: DataTypes.STRING, allowNull: false },
  gia: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  loai: { type: DataTypes.STRING } // ví dụ: tra, ca phe, do an
}, {
  tableName: "SanPham",
  timestamps: false
});

module.exports = SanPham;
