// controllers/order.controller.js
const { sequelize, DonHang, ChiTietDonHang, SanPham, Ban, ThanhToan } = require("../models");

// ====== HÀM SINH KHÓA CHÍNH SỐ NGUYÊN KHÔNG DÙNG findOne (KHẮC PHỤC LỖI 8127) ======
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

// ====== HÀM HIỂN THỊ MÃ (ví dụ: DH001) ======
function formatOrderCode(id) {
  return `DH${String(id).padStart(3, "0")}`;
}

// ==================== TẠO ĐƠN HÀNG MỚI ====================
exports.createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { maBan, items } = req.body;
    const maNV = req.user.maNV; // nhân viên đang tạo

    if (!maBan) {
      await t.rollback();
      return res.status(400).json({ message: "Thiếu maBan" });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "Thiếu items" });
    }

    // ✅ Sinh mã số tự động (INT)
    const maDH = await generateNumericId(DonHang, "maDH", t);

    // ✅ Tạo đơn hàng
    const order = await DonHang.create(
      {
        maDH,
        maNV,
        maBan,
        tongTien: 0,
        trangThai: "DangXuLy",
        thoiGian: new Date()
      },
      { transaction: t }
    );

    let total = 0;

    for (const it of items) {
      const sp = await SanPham.findByPk(it.maSP);
      if (!sp) {
        await t.rollback();
        return res.status(400).json({
          message: `Không tìm thấy sản phẩm maSP=${it.maSP}`
        });
      }

      const qty = parseInt(it.soLuong) || 1;

      // ✅ Sinh khóa chính ChiTietDonHang (INT không tự tăng)
      const maCTDH = await generateNumericId(ChiTietDonHang, "maCTDH", t);

      await ChiTietDonHang.create(
        {
          maCTDH,
          maDH: order.maDH,
          maSP: sp.maSP,
          soLuong: qty,
          ghiChu: it.ghiChu || null
        },
        { transaction: t }
      );

      total += (sp.gia || 0) * qty;
    }

    // ✅ Cập nhật tổng tiền
    order.tongTien = total;
    await order.save({ transaction: t });

    // ✅ Cập nhật trạng thái bàn
    const table = await Ban.findByPk(maBan, { transaction: t });
    if (table) {
      table.trangThai = "DangPhucVu";
      await table.save({ transaction: t });
    }

    await t.commit();
    return res.status(201).json({
      message: "Tạo đơn hàng thành công",
      orderId: formatOrderCode(order.maDH), // ví dụ DH004
      tongTien: order.tongTien
    });
  } catch (err) {
    if (t) {
      try {
        await t.rollback();
      } catch (rollbackErr) {
        console.error("Rollback error:", rollbackErr.message);
      }
    }
    console.error(err);
    return res
      .status(500)
      .json({ message: "Lỗi tạo đơn hàng", error: err.message });
  }
};

// ==================== THÊM SẢN PHẨM VÀO ĐƠN ====================
exports.addItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const maDH = req.params.id;
    const { maSP, soLuong, ghiChu } = req.body;

    const order = await DonHang.findByPk(maDH, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: "DonHang không tồn tại" });
    }
    if (order.trangThai === "DaThanhToan") {
      await t.rollback();
      return res.status(400).json({ message: "Đơn đã thanh toán" });
    }

    const sp = await SanPham.findByPk(maSP);
    if (!sp) {
      await t.rollback();
      return res.status(404).json({ message: "SanPham không tồn tại" });
    }

    const qty = parseInt(soLuong) || 1;
    const maCTDH = await generateNumericId(ChiTietDonHang, "maCTDH", t);

    await ChiTietDonHang.create(
      { maCTDH, maDH, maSP, soLuong: qty, ghiChu: ghiChu || null },
      { transaction: t }
    );

    order.tongTien = (order.tongTien || 0) + (sp.gia || 0) * qty;
    await order.save({ transaction: t });

    await t.commit();
    return res.json({
      message: "Thêm sản phẩm vào đơn thành công",
      tongTien: order.tongTien
    });
  } catch (err) {
    if (t) {
      try {
        await t.rollback();
      } catch (rollbackErr) {
        console.error("Rollback error:", rollbackErr.message);
      }
    }
    console.error(err);
    return res
      .status(500)
      .json({ message: "Lỗi thêm sản phẩm", error: err.message });
  }
};

// ==================== CẬP NHẬT SỐ LƯỢNG ITEM ====================
exports.updateItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { maCTDH } = req.params;
    const { soLuong } = req.body;
    const item = await ChiTietDonHang.findByPk(maCTDH, { transaction: t });
    if (!item) {
      await t.rollback();
      return res.status(404).json({ message: "ChiTietDonHang không tồn tại" });
    }

    const order = await DonHang.findByPk(item.maDH, { transaction: t });
    if (order.trangThai === "DaThanhToan") {
      await t.rollback();
      return res.status(400).json({ message: "Đơn đã thanh toán" });
    }

    const sp = await SanPham.findByPk(item.maSP, { transaction: t });
    const oldQty = item.soLuong;
    const newQty = parseInt(soLuong) || 1;

    item.soLuong = newQty;
    await item.save({ transaction: t });

    order.tongTien =
      (order.tongTien || 0) + (newQty - oldQty) * (sp.gia || 0);
    await order.save({ transaction: t });

    await t.commit();
    return res.json({
      message: "Cập nhật số lượng thành công",
      tongTien: order.tongTien
    });
  } catch (err) {
    if (t) {
      try {
        await t.rollback();
      } catch (rollbackErr) {
        console.error("Rollback error:", rollbackErr.message);
      }
    }
    console.error(err);
    return res
      .status(500)
      .json({ message: "Lỗi cập nhật item", error: err.message });
  }
};

// ==================== XÓA ITEM KHỎI ĐƠN ====================
exports.removeItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { maCTDH } = req.params;
    const item = await ChiTietDonHang.findByPk(maCTDH, { transaction: t });
    if (!item) {
      await t.rollback();
      return res.status(404).json({ message: "ChiTietDonHang không tồn tại" });
    }

    const order = await DonHang.findByPk(item.maDH, { transaction: t });
    if (order.trangThai === "DaThanhToan") {
      await t.rollback();
      return res.status(400).json({ message: "Đơn đã thanh toán" });
    }

    const sp = await SanPham.findByPk(item.maSP, { transaction: t });
    order.tongTien = (order.tongTien || 0) - (sp.gia || 0) * item.soLuong;
    if (order.tongTien < 0) order.tongTien = 0;

    await order.save({ transaction: t });
    await item.destroy({ transaction: t });

    await t.commit();
    return res.json({
      message: "Xóa item thành công",
      tongTien: order.tongTien
    });
  } catch (err) {
    if (t) {
      try {
        await t.rollback();
      } catch (rollbackErr) {
        console.error("Rollback error:", rollbackErr.message);
      }
    }
    console.error(err);
    return res
      .status(500)
      .json({ message: "Lỗi xóa item", error: err.message });
  }
};

// ==================== LẤY DANH SÁCH ĐƠN ====================
exports.getOrders = async (req, res) => {
  try {
    const where = {};
    if (req.user.vaiTro !== "admin" && req.user.vaiTro !== "QuanLy")
      where.maNV = req.user.maNV;

    const orders = await DonHang.findAll({
      where,
      // ⭐ SỬA: THÊM { model: ThanhToan } ĐỂ LẤY THÔNG TIN THANH TOÁN
      include: [
          { model: ChiTietDonHang, include: [{ model: SanPham }] },
          { model: ThanhToan } 
      ],
      order: [["thoiGian", "DESC"]]
    });

    // ✅ Gắn thêm mã hiển thị
    const result = orders.map((o) => ({
      ...o.toJSON(),
      maDH_text: formatOrderCode(o.maDH)
    }));

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Lỗi lấy đơn hàng", error: err.message });
  }
};

// ==================== LẤY CHI TIẾT 1 ĐƠN HÀNG ====================
exports.getOrderById = async (req, res) => {
  try {
    const id = req.params.id;
    const order = await DonHang.findByPk(id, {
      include: [
        { model: ChiTietDonHang, include: [{ model: SanPham }] },
        { model: ThanhToan }
      ]
    });
    if (!order)
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    return res.json({
      ...order.toJSON(),
      maDH_text: formatOrderCode(order.maDH)
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Lỗi lấy đơn hàng", error: err.message });
  }
};

// ======================== CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG ========================
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { trangThai } = req.body;

    const order = await DonHang.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    order.trangThai = trangThai;
    await order.save();

    res.json({
      message: "Cập nhật trạng thái đơn hàng thành công",
      order,
    });
  } catch (error) {
    console.error("Lỗi updateOrderStatus:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};