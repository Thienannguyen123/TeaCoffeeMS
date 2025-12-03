// controllers/table.controller.js
const { Ban, DonHang, sequelize } = require("../models"); 
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


// Tạo bàn (Admin)
exports.createTable = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    
    const { tenBan, trangThai } = req.body; 
    if (!tenBan) {
        await t.rollback();
        return res.status(400).json({ message: "Thiếu tenBan" });
    }

    const maBan = await generateNumericId(Ban, "maBan", t);

    const b = await Ban.create({ 
      maBan: maBan, // Gán maBan đã sinh
      tenBan, 
      trangThai: trangThai || "Trong" 
    }, { transaction: t });
    
    await t.commit();
    return res.status(201).json(b);

  } catch (err) {
    if (t) await t.rollback();
    console.error(err);
    return res.status(500).json({ message: "Lỗi tạo bàn", error: err.message });
  }
};

// Lấy danh sách bàn (tất cả)
exports.getAllTables = async (req, res) => {
  try {
    const list = await Ban.findAll();
    return res.json(list);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi lấy danh sách bàn", error: err.message });
  }
};

// Cập nhật thông tin bàn (Admin)
exports.updateTable = async (req, res) => {
  try {
    const id = req.params.id;
    const b = await Ban.findByPk(id);
    if (!b) return res.status(404).json({ message: "Không tìm thấy bàn" });

    const { tenBan, trangThai } = req.body;
    if (tenBan !== undefined) b.tenBan = tenBan;
    if (trangThai !== undefined) b.trangThai = trangThai;

    await b.save();
    return res.json(b);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi cập nhật bàn", error: err.message });
  }
};

// Xóa bàn (Admin)
exports.deleteTable = async (req, res) => {
  try {
    const id = req.params.id;
    const b = await Ban.findByPk(id);
    if (!b) return res.status(404).json({ message: "Không tìm thấy bàn" });

    // (tuỳ nghiệp vụ: nếu có đơn hàng đang dùng có thể không cho xóa)
    const openOrders = await DonHang.count({ where: { maBan: id, trangThai: "DangXuLy" } }); // Sửa: "cho" -> "DangXuLy"
    if (openOrders > 0) return res.status(400).json({ message: "Bàn đang có đơn hàng chưa thanh toán, không thể xóa" });

    await b.destroy();
    return res.json({ message: "Xóa bàn thành công" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi xóa bàn", error: err.message });
  }
};

// Cập nhật trạng thái bàn (NV có thể cập nhật trạng thái khi phục vụ)
exports.updateTableStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { trangThai } = req.body;
    const b = await Ban.findByPk(id);
    if (!b) return res.status(404).json({ message: "Không tìm thấy bàn" });

    // Sửa: Khớp với database
    if (!["Trong", "DangPhucVu", "DaDatTruoc"].includes(trangThai)) { 
      return res.status(400).json({ message: "TrangThai không hợp lệ" });
    }

    b.trangThai = trangThai;
    await b.save();
    return res.json(b);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi cập nhật trạng thái bàn", error: err.message });
  }
};