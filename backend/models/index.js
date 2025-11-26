// models/index.js
// Import tất cả model và tạo association ở đây
const sequelize = require("../config/db");

const NhanVien = require("./NhanVien");
const SanPham = require("./SanPham");
const Ban = require("./Ban");
const DonHang = require("./DonHang");
const ChiTietDonHang = require("./ChiTietDonHang");
const ThanhToan = require("./ThanhToan");
const BaoCao = require("./BaoCao");
const NghiPhep = require("./Nghiphep")
const ChamCong = require("./ChamCong");
const LichLamViec = require("./LichLamViec");


// Associations (foreign keys)
// NhanVien (1) <-> (N) DonHang
NhanVien.hasMany(DonHang, { foreignKey: "maNV", sourceKey: "maNV" });
DonHang.belongsTo(NhanVien, { foreignKey: "maNV", targetKey: "maNV" });

// Ban (1) <-> (N) DonHang
Ban.hasMany(DonHang, { foreignKey: "maBan", sourceKey: "maBan" });
DonHang.belongsTo(Ban, { foreignKey: "maBan", targetKey: "maBan" });

// DonHang (1) <-> (N) ChiTietDonHang
DonHang.hasMany(ChiTietDonHang, { foreignKey: "maDH", sourceKey: "maDH" });
ChiTietDonHang.belongsTo(DonHang, { foreignKey: "maDH", targetKey: "maDH" });

// SanPham (1) <-> (N) ChiTietDonHang
SanPham.hasMany(ChiTietDonHang, { foreignKey: "maSP", sourceKey: "maSP" });
ChiTietDonHang.belongsTo(SanPham, { foreignKey: "maSP", targetKey: "maSP" });

// DonHang (1) <-> (1) ThanhToan
DonHang.hasOne(ThanhToan, { foreignKey: "maDH", sourceKey: "maDH" });
ThanhToan.belongsTo(DonHang, { foreignKey: "maDH", targetKey: "maDH" });


NhanVien.hasMany(NghiPhep, { foreignKey: 'maNV', sourceKey: 'maNV' });
NghiPhep.belongsTo(NhanVien, { foreignKey: 'maNV', targetKey: 'maNV' });

NhanVien.hasMany(ChamCong, { foreignKey: 'maNV', sourceKey: 'maNV' });
ChamCong.belongsTo(NhanVien, { foreignKey: 'maNV', targetKey: 'maNV' });

NhanVien.hasMany(LichLamViec, { foreignKey: 'maNV', sourceKey: 'maNV' });
LichLamViec.belongsTo(NhanVien, { foreignKey: 'maNV', targetKey: 'maNV' });

module.exports = {
  sequelize,
  NhanVien,
  SanPham,
  Ban,
  DonHang,
  ChiTietDonHang,
  ThanhToan,
  BaoCao,
  NghiPhep,
  ChamCong,
  LichLamViec
};
