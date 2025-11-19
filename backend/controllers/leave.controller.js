// controllers/leave.controller.js
const { NghiPhep, NhanVien } = require("../models");

// ADMIN: Lấy TẤT CẢ đơn nghỉ phép
exports.getLeavesForAdmin = async (req, res) => {
    try {
        const leaveRequests = await NghiPhep.findAll({
            include: { model: NhanVien, attributes: ['tenNV'] } // Lấy cả tên NV
        });
        res.json(leaveRequests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// STAFF: Nộp đơn nghỉ phép
exports.createLeave = async (req, res) => {
    try {
        const newLeave = await NghiPhep.create({
            ...req.body,
            maNV: req.user.maNV // Lấy maNV từ token
        });
        res.status(201).json(newLeave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ADMIN: Duyệt đơn
exports.approveLeave = async (req, res) => {
    try {
        await NghiPhep.update(
            { trangThai: 'DaDuyet' },
            { where: { maNP: req.params.id } }
        );
        res.json({ message: 'Đã duyệt đơn nghỉ phép.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ADMIN: Từ chối đơn
exports.rejectLeave = async (req, res) => {
     try {
        await NghiPhep.update(
            { trangThai: 'TuChoi' },
            { where: { maNP: req.params.id } }
        );
        res.json({ message: 'Đã từ chối đơn nghỉ phép.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// STAFF: Lấy lịch sử nghỉ phép CỦA TÔI
exports.getMyLeaves = async (req, res) => {
     try {
        const myLeaves = await NghiPhep.findAll({
            where: { maNV: req.user.maNV }, // Lấy maNV từ token
            order: [['tuNgay', 'DESC']]
        });
        res.json(myLeaves);
    } catch (err) { 
        res.status(500).json({ message: "Lỗi tải lịch sử nghỉ phép: " + err.message }); 
    }
};