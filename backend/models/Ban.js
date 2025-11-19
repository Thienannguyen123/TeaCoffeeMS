// models/Ban.js
// Model Bàn (maBan, tenBan, trangThai)
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Ban = sequelize.define("Ban", {
  maBan: { type: DataTypes.INTEGER, primaryKey: true},
  tenBan: { type: DataTypes.STRING, allowNull: false },
  trangThai: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Trong", // 'trong', 'dang_phuc_vu', 'dat_truoc'
    validate: { isIn: [["Trong", "DangPhucVu", "DaDatTruoc"]] }
  }
}, {
  tableName: "Ban",
  timestamps: false
});

module.exports = Ban;
