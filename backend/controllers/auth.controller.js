// controllers/auth.controller.js
const { NhanVien, sequelize } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
require("dotenv").config();

// Cấu hình Google Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID");

// ====== HÀM SINH ID (BẮT BUỘC PHẢI CÓ ĐỂ TẠO USER GOOGLE) ======
async function generateNumericId(model, columnName, transaction = null) {
  const tableName = model.getTableName();
  const [results] = await sequelize.query(
    `SELECT MAX(${columnName}) AS maxId FROM ${tableName};`,
    { transaction }
  );
  const maxId = results[0]?.maxId || 0;
  return maxId + 1;
}

// =======================
// 1️⃣ Đăng nhập thường 
// =======================
exports.login = async (req, res) => {
  try {
    const { taiKhoan, matKhau } = req.body;

    // 1. Tìm nhân viên
    const user = await NhanVien.findOne({ where: { taiKhoan: taiKhoan } });
    if (!user) {
      return res.status(404).json({ message: "Tài khoản không tồn tại!" });
    }

    let isPasswordValid = false;
    let needsUpgrade = false;

    // 2. Kiểm tra mật khẩu (Hybrid: Bcrypt hoặc Plaintext)
    try {
        isPasswordValid = await bcrypt.compare(matKhau, user.matKhau);
    } catch (err) {
        isPasswordValid = false;
    }

    // Nếu Bcrypt thất bại, thử so sánh thường (cho các user cũ)
    if (!isPasswordValid) {
        if (matKhau === user.matKhau) {
            isPasswordValid = true;
            needsUpgrade = true; 
        }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Mật khẩu không chính xác!" });
    }

    // Tự động nâng cấp mật khẩu cũ
    if (needsUpgrade) {
        const salt = await bcrypt.genSalt(10);
        user.matKhau = await bcrypt.hash(matKhau, salt);
        await user.save();
    }

    // 3. Tạo Token
    const token = jwt.sign(
      { maNV: user.maNV, vaiTro: user.vaiTro },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "24h" }
    );

    const userData = user.toJSON();
    delete userData.matKhau;

    res.json({
      message: "Đăng nhập thành công!",
      token: token,
      user: userData
    });

  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

// =======================
// 2️⃣ Đăng nhập bằng Google
// =======================
exports.googleLogin = async (req, res) => {
  const t = await sequelize.transaction(); 
  try {
    const { tokenId } = req.body;
    
    // 1. Xác thực token với Google
    const ticket = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const { email, name } = ticket.getPayload();

    // 2. Tìm user trong DB
    let user = await NhanVien.findOne({ where: { taiKhoan: email } }, { transaction: t });

    if (!user) {
        // 3. Nếu chưa có -> TẠO MỚI (QUAN TRỌNG: PHẢI SINH ID)
        const maNV = await generateNumericId(NhanVien, "maNV", t);
        
        // Mật khẩu ngẫu nhiên cho user Google (họ sẽ không dùng nó để đăng nhập thường)
        const randomPass = Math.random().toString(36).slice(-8);
        const hashedPass = await bcrypt.hash(randomPass, 10);

        user = await NhanVien.create({
            maNV: maNV, 
            tenNV: name,
            taiKhoan: email,
            matKhau: hashedPass,
            vaiTro: "NhanVien", 
            caLamViec: "Ca sáng"
        }, { transaction: t });
    }

    await t.commit();

    // 4. Tạo Token JWT của hệ thống mình
    const token = jwt.sign(
        { maNV: user.maNV, vaiTro: user.vaiTro },
        process.env.JWT_SECRET || "secret_key",
        { expiresIn: "24h" }
    );

    const userData = user.toJSON();
    delete userData.matKhau;

    res.json({
        message: "Đăng nhập Google thành công!",
        token: token,
        user: userData
    });

  } catch (error) {
    if(t) await t.rollback();
    console.error("Lỗi Google Login:", error);
    res.status(500).json({ message: "Lỗi xác thực Google" });
  }
};