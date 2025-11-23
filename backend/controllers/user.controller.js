// controllers/user.controller.js
const bcrypt = require("bcryptjs");
const { NhanVien, sequelize } = require("../models"); 

async function generateNumericId(model, columnName, transaction = null) {
  console.log("==> generateNumericId version SQL chạy");
  const tableName = model.getTableName();

  const [results] = await sequelize.query(
    `SELECT MAX(${columnName}) AS maxId FROM ${tableName};`
  );
  const maxId = results[0]?.maxId || 0;
  return maxId + 1;
}



// ==================== TẠO USER MỚI (ĐÃ SỬA) ====================
exports.createUser = async (req, res) => {
  try {
    // 1. Tự động sinh maNV mới
    const maNV = await generateNumericId(NhanVien, "maNV");

    // 2. Lấy dữ liệu từ frontend
    const { tenNV, taiKhoan, vaiTro, caLamViec } = req.body;
    
    // Đặt mật khẩu mặc định nếu frontend không gửi
    const matKhau = req.body.matKhau || '123456'; 

    // 3. Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(matKhau, salt);

    // 4. Tạo nhân viên mới
    const newUser = await NhanVien.create({
      maNV: maNV, // Gán maNV đã sinh
      tenNV: tenNV,
      taiKhoan: taiKhoan,
      matKhau: hashed, 
      vaiTro: vaiTro, // Dòng này sẽ nhận 'NhanVien' (sau khi bạn xóa cache)
      caLamViec: caLamViec || 'Ca sáng' 
    });
    
    res.status(201).json(newUser);

  } catch (err) {
    // Sửa: Xử lý lỗi validation và gửi về cho frontend
    if (err.name === 'SequelizeValidationError') {
        console.error("Lỗi Validation:", err.errors[0].message);
        return res.status(400).json({ message: err.errors[0].message });
    }
    
    console.error("Lỗi tạo nhân viên:", err); // In lỗi thật ra terminal
    res.status(500).json({ message: "Lỗi tạo nhân viên", error: err.message });
  }
};


// ==================== LẤY TẤT CẢ USER ====================
exports.getAllUsers = async (req, res) => {
  try {
    const users = await NhanVien.findAll({
      attributes: { exclude: ['matKhau'] } // Không gửi mật khẩu về frontend
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Lỗi: " + err.message });
  }
};

// Cập nhật nhân viên (Admin)
exports.updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { tenNV, taiKhoan, matKhau, vaiTro, caLamViec } = req.body;

    const user = await NhanVien.findByPk(id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy nhân viên" });

    if (matKhau) {
      const salt = await bcrypt.genSalt(10);
      user.matKhau = await bcrypt.hash(matKhau, salt);
    }
    if (tenNV) user.tenNV = tenNV;
    if (taiKhoan) user.taiKhoan = taiKhoan;
    if (vaiTro) user.vaiTro = vaiTro;
    if (caLamViec) user.caLamViec = caLamViec;

    await user.save();
    const result = user.toJSON();
    delete result.matKhau;
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi cập nhật nhân viên", error: err.message });
  }
};

// Xóa nhân viên (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await NhanVien.findByPk(id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy nhân viên" });

    await user.destroy();
    return res.json({ message: "Xóa nhân viên thành công" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi xóa nhân viên", error: err.message });
  }
};

// Lấy thông tin profile (self)
exports.getProfile = async (req, res) => {
  try {
    const maNV = req.user.maNV;
    const user = await NhanVien.findByPk(maNV, { attributes: { exclude: ["matKhau"] } });
    if (!user) return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi lấy profile", error: err.message });
  }
};


// ==================== ĐẶT LẠI MẬT KHẨU NHÂN VIÊN (ADMIN) ====================
exports.resetPassword = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await NhanVien.findByPk(id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy nhân viên" });

    const defaultPassword = '123456';
    const salt = await bcrypt.genSalt(10);
    user.matKhau = await bcrypt.hash(defaultPassword, salt);

    await user.save();

    return res.json({ message: `Đặt lại mật khẩu thành công. Mật khẩu mới: ${defaultPassword}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi đặt lại mật khẩu", error: err.message });
  }
};


// ==================== ĐỔI MẬT KHẨU (SELF) ====================
exports.changePassword = async (req, res) => {
  try {
    const maNV = req.user.maNV;
    const vaiTro = req.user.vaiTro;
    const roleToCompare = vaiTro ? vaiTro.toLowerCase() : '';

    console.log(`DEBUG: Vai trò gốc từ Token: [${vaiTro}]`);
    console.log(`DEBUG: Vai trò so sánh (lowercase): [${roleToCompare}]`);

    if (!['nhanvien', 'quanly', 'admin'].includes(roleToCompare)) {
      console.log("Forbidden: Vai trò bị chặn.");
      return res.status(403).json({ message: "Vai trò của bạn không được phép đổi mật khẩu." });
     }

    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Mật khẩu mới và xác nhận mật khẩu không khớp" });
    }

    const user = await NhanVien.findByPk(maNV);
    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

    const isMatch = await bcrypt.compare(oldPassword, user.matKhau);
    if (!isMatch) return res.status(400).json({ message: "Mật khẩu cũ không đúng" });

    const salt = await bcrypt.genSalt(10);
    user.matKhau = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi đổi mật khẩu", error: err.message });
  }
};


