// controllers/product.controller.js

const { SanPham, sequelize } = require("../models");

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

exports.createProduct = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // 1. Tự động sinh maSP mới
    const maSP = await generateNumericId(SanPham, "maSP", t);

    // 2. Lấy dữ liệu từ frontend
    const { tenSP, loai, gia } = req.body;

    // 3. Tạo sản phẩm với maSP đã sinh
    const newProduct = await SanPham.create({
      maSP: maSP, // Thêm maSP vào đây
      tenSP: tenSP,
      loai: loai,
      gia: parseFloat(gia) // Đảm bảo giá là số
    }, { transaction: t });
    
    await t.commit();
    res.status(201).json(newProduct);

  } catch (err) {
    if (t) await t.rollback(); 
    console.error("Lỗi tạo sản phẩm:", err);
    res.status(500).json({ message: "Lỗi tạo sản phẩm", error: err.message });
  }
};


// Lấy tất cả sản phẩm (Admin + NV)
exports.getAllProducts = async (req, res) => {
  try {
    const list = await SanPham.findAll();
    return res.json(list);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi lấy sản phẩm", error: err.message });
  }
};

// Lấy 1 sản phẩm theo id
exports.getProductById = async (req, res) => {
  try {
    const id = req.params.id;
    const sp = await SanPham.findByPk(id);
    if (!sp) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    return res.json(sp);
  } catch (err) {
   console.error("Lỗi lấy sản phẩm:", err);
   return res.status(500).json({ message: "Lỗi lấy sản phẩm", error: err.message });
  }
};

// Cập nhật sản phẩm (Admin)
exports.updateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const sp = await SanPham.findByPk(id);
    if (!sp) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    const { tenSP, gia, loai } = req.body;
    if (tenSP !== undefined) sp.tenSP = tenSP;
    if (gia !== undefined) sp.gia = gia;
    if (loai !== undefined) sp.loai = loai;

    await sp.save();
    return res.json(sp);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi cập nhật sản phẩm", error: err.message });
  }
};

// Xóa sản phẩm (Admin)
exports.deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const sp = await SanPham.findByPk(id);
    if (!sp) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    await sp.destroy();
    return res.json({ message: "Xóa sản phẩm thành công" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi xóa sản phẩm", error: err.message });
  }
};