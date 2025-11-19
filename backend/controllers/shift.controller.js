// controllers/shift.controller.js
const { LichLamViec, NhanVien } = require("../models");

// Admin: Gán một ca làm việc mới
exports.assignShift = async (req, res) => {
    try {
        const newShift = await LichLamViec.create(req.body);
        res.status(201).json(newShift);
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi xếp ca: " + err.message });
    }
};

// Staff: Lấy ca làm việc của cá nhân tôi
exports.getMyShifts = async (req, res) => {
     try {
        const myShifts = await LichLamViec.findAll({
            where: { maNV: req.user.maNV }, // Lấy maNV từ token (authenticate)
            order: [['ngayLamViec', 'DESC']]
        });
        res.json(myShifts);
    } catch (err) { 
        res.status(500).json({ message: "Lỗi tải ca làm việc: " + err.message }); 
    }
};