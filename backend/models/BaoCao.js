// models/BaoCao.js
// Model Báo cáo (maBC, ngay, tongDoanhThu, tongLoiNhuan, sanPhamBanChay)
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const BaoCao = sequelize.define("BaoCao", {
  maBC: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ngay: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  tongDoanhThu: { type: DataTypes.FLOAT, defaultValue: 0 },
  tongLoiNhuan: { type: DataTypes.FLOAT, defaultValue: 0 },
  sanPhamBanChay: { type: DataTypes.STRING } // lưu tên sản phẩm bán chạy
}, {
  tableName: "BaoCao",
  timestamps: true
});

module.exports = BaoCao;
