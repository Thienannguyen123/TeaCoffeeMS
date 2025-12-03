// controllers/payment.controller.js
const { sequelize, ThanhToan, DonHang, Ban } = require("../models");

// Hàm sinh ID
async function generateNumericId(model, columnName, transaction = null) {
  console.log("==> generateNumericId version SQL chạy");
  const tableName = model.getTableName();
  const [results] = await sequelize.query(
    `SELECT MAX(${columnName}) AS maxId FROM ${tableName};`,
    { transaction }
  );
  const maxId = results[0]?.maxId || 0;
  return maxId + 1;
}

// Hàm định dạng ngày giờ cho SQL
function getSQLDateTime(dateObj) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${dateObj.getFullYear()}-${pad(dateObj.getMonth()+1)}-${pad(dateObj.getDate())} `
       + `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
}


// ==========================================================
// TẠO THANH TOÁN
// ==========================================================
exports.createPayment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { maDH, phuongThuc } = req.body;

    if (!maDH) {
  return res.status(400).json({ message: "Thiếu mã đơn hàng" });
}

const method = phuongThuc || "TienMat";  // 👈 tự động mặc định


    // 1. Tìm đơn hàng
    const order = await DonHang.findByPk(maDH, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    if (order.trangThai === 'DaThanhToan') {
       await t.rollback();
       return res.status(400).json({ message: "Đơn hàng này đã được thanh toán rồi" });
    }

    // 2. Sinh mã thanh toán
    const maTT = await generateNumericId(ThanhToan, "maTT", t);

    // 3. Tạo thanh toán mới
    await ThanhToan.create({
  maTT: maTT,
  maDH: maDH,
  soTien: order.tongTien,
  phuongThuc: method,        // 👈 dùng method đã gán mặc định
  thoiGian: getSQLDateTime(new Date())
}, { transaction: t });


    // 4. Cập nhật trạng thái đơn hàng -> DaThanhToan
    order.trangThai = 'DaThanhToan';
    await order.save({ transaction: t });

    // 5. Cập nhật trạng thái bàn -> Trong
    if (order.maBan) {
      const table = await Ban.findByPk(order.maBan, { transaction: t });
      if (table) {
        table.trangThai = 'Trong';
        await table.save({ transaction: t });
      }
    }

    // Hoàn tất
    await t.commit();
    res.status(201).json({ message: "Thanh toán thành công!" });

  } catch (err) {
    if (t) await t.rollback();
    console.error("Lỗi tạo thanh toán:", err);
    res.status(500).json({ message: "Lỗi khi tạo thanh toán", error: err.message });
  }
};