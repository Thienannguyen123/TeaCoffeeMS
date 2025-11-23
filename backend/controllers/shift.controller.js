// controllers/shift.controller.js
const { LichLamViec, NhanVien } = require("../models");

// 1. Tạo ca làm việc (Dùng cho cả Admin xếp ca và NV tự điểm danh)
exports.assignShift = async (req, res) => {
    try {
        // Nếu là nhân viên tự điểm danh, đảm bảo họ không điểm danh hộ người khác
        // (Logic phụ: nếu req.user.role !== 'admin' && req.body.maNV !== req.user.maNV) -> chặn
        
        const newShift = await LichLamViec.create(req.body);
        res.status(201).json(newShift);
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi tạo ca: " + err.message });
    }
};

// 2. Lấy ca làm việc của cá nhân
exports.getMyShifts = async (req, res) => {
     try {
        const myShifts = await LichLamViec.findAll({
            where: { maNV: req.user.maNV }, 
            order: [['ngayLamViec', 'DESC']]
        });
        res.json(myShifts);
    } catch (err) { 
        res.status(500).json({ message: "Lỗi tải ca làm việc: " + err.message }); 
    }
};

// 3. (MỚI) Cập nhật ca làm việc (Dùng để Tan Ca - update giờ kết thúc)
exports.updateShift = async (req, res) => {
    try {
        const shiftId = req.params.id;
        const { gioKetThuc } = req.body; // Chỉ nhận giờ kết thúc

        // Tìm ca làm việc theo ID
        const shift = await LichLamViec.findByPk(shiftId);
        if (!shift) {
            return res.status(404).json({ message: "Không tìm thấy ca làm việc" });
        }

        // Cập nhật
        if (gioKetThuc) shift.gioKetThuc = gioKetThuc;
        // Có thể update thêm các field khác nếu cần

        await shift.save();
        res.json({ message: "Cập nhật thành công", shift });
    } catch (err) {
        res.status(500).json({ message: "Lỗi cập nhật ca: " + err.message });
    }
};

exports.getAllShifts = async (req, res) => {
    try {
        // Lấy tất cả, sắp xếp ngày mới nhất lên đầu
        // Kèm theo thông tin Nhân viên (để hiển thị tên)
        const shifts = await LichLamViec.findAll({
            include: [{ 
                model: NhanVien, 
                attributes: ['tenNV', 'maNV', 'vaiTro'] // Chỉ lấy các cột cần thiết
            }], 
            order: [['ngayLamViec', 'DESC']]
        });
        res.json(shifts);
    } catch (err) {
        res.status(500).json({ message: "Lỗi tải dữ liệu chấm công: " + err.message });
    }
};