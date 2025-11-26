// controllers/attendance.controller.js
const { ChamCong, NhanVien, LichLamViec, sequelize } = require("../models");
const { Op } = require("sequelize"); 

// ADMIN: Lấy tất cả dữ liệu chấm công (ĐÃ SỬA LỖI SQL)
exports.getAttendanceForAdmin = async (req, res) => {
    try {
        const [records] = await sequelize.query(`
            SELECT 
                cc.maCC, cc.ngay, cc.gioVao, cc.gioRa, 
                nv.tenNV, nv.vaiTro, llv.tenCa, llv.gioBatDau,
                
                -- SỬA LỖI Ở ĐÂY: Thêm CAST( ... AS TIME)
                CASE
                -- Nếu cột trangThai đã có giá trị (Admin đã sửa), dùng giá trị đó
                WHEN cc.trangThai IN (N'Đúng giờ', N'Đi trễ', N'Ngoài giờ') THEN cc.trangThai 

                -- Nếu chưa có (NULL), thì tính toán như cũ
                WHEN llv.gioBatDau IS NULL THEN N'Không có ca'
                WHEN cc.gioVao IS NULL THEN N'Chưa check-in'
                WHEN CAST(cc.gioVao AS TIME) > llv.gioBatDau THEN N'Đi trễ'
                ELSE N'Đúng giờ'
                END AS trangThaiTinhToan
                
            FROM ChamCong cc
            LEFT JOIN NhanVien nv ON cc.maNV = nv.maNV
            LEFT JOIN LichLamViec llv ON cc.maNV = llv.maNV AND cc.ngay = llv.ngayLamViec
            ORDER BY cc.ngay DESC, cc.gioVao DESC
        `);
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================================
// ⭐ HÀM SỬA LỖI ĐỊNH DẠNG NGÀY GIỜ (VIẾT LẠI)
// ==========================================================
function getSQLDateTime(dateObj) {
    // Lấy ngày giờ theo múi giờ Việt Nam
    const vnTime = new Date(dateObj.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));

    const year = vnTime.getFullYear();
    const month = String(vnTime.getMonth() + 1).padStart(2, '0'); // +1 vì tháng bắt đầu từ 0
    const day = String(vnTime.getDate()).padStart(2, '0');
    const hours = String(vnTime.getHours()).padStart(2, '0');
    const minutes = String(vnTime.getMinutes()).padStart(2, '0');
    const seconds = String(vnTime.getSeconds()).padStart(2, '0');

    // Trả về chuỗi SQL Server hiểu
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// =HÀM LẤY NGÀY (YYYY-MM-DD) THEO MÚI GIỜ VIỆT NAM
function getSQLDateOnly(dateObj) {
     const vnTime = new Date(dateObj.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
     const year = vnTime.getFullYear();
     const month = String(vnTime.getMonth() + 1).padStart(2, '0');
     const day = String(vnTime.getDate()).padStart(2, '0');
     return `${year}-${month}-${day}`;
}


// ==========================================================
// ⭐ HÀM CHECK-IN / CHECK-OUT (ĐÃ SỬA LỖI)
// ==========================================================
exports.toggleCheckIn = async (req, res) => {
    const maNV = req.user.maNV; // Lấy maNV từ token
    const today = new Date(); // Giờ hiện tại
    
    // Lấy ngày hôm nay (YYYY-MM-DD)
    const todayDateOnly = getSQLDateOnly(today);

    try {
        // 1. Tìm bản ghi "chưa check-out" của hôm nay
        const existingRecord = await ChamCong.findOne({
            where: {
                maNV: maNV,
                ngay: todayDateOnly,
                gioRa: null 
            }
        });

        // 2. Nếu tìm thấy -> Đang Check-out
        if (existingRecord) {
            existingRecord.gioRa = getSQLDateTime(today); // Định dạng giờ check-out
            await existingRecord.save();
            return res.json({ message: "Check-out thành công", status: "checked-out" });
        }

        // 3. Nếu không tìm thấy -> Đang Check-in
        else {
            // Tìm ca làm việc hôm nay để xác định đi trễ/đúng giờ
            const shift = await LichLamViec.findOne({
                where: {
                    maNV: maNV,
                    ngayLamViec: todayDateOnly
                }
            });

            let trangThai = 'Đúng giờ';
            if (shift && shift.gioBatDau) {
                // (Sửa lỗi 'split' từ trước)
                const shiftTime = new Date(shift.gioBatDau); 
                const hours = shiftTime.getUTCHours(); 
                const minutes = shiftTime.getUTCMinutes();
                
                const shiftStartTime = new Date(); 
                shiftStartTime.setHours(hours, minutes, 0, 0); 

                if (today > shiftStartTime) {
                    trangThai = 'Đi trễ';
                }
            } else {
                trangThai = 'Ngoài giờ'; // Không tìm thấy ca
            }

            // Định dạng 'gioVao' thành chuỗi SQL
            const gioVaoSQL = getSQLDateTime(today);

            // Tạo bản ghi chấm công mới
            await ChamCong.create({
                maNV: maNV,
                ngay: todayDateOnly,
                gioVao: gioVaoSQL, // <-- Gửi chuỗi đã định dạng
                gioRa: null,
                trangThai: trangThai 
            });
            return res.json({ message: "Check-in thành công", status: "checked-in" });
        }
    } catch (error) {
        console.error("Lỗi toggleCheckIn:", error);
        res.status(500).json({ message: "Lỗi hệ thống điểm danh: " + error.message });
    }
};

// ==========================================================
// LẤY TRẠNG THÁI (ĐÃ CHECK-IN HAY CHƯA?)
// ==========================================================
exports.getCheckInStatus = async (req, res) => {
    const maNV = req.user.maNV;
    const todayDateOnly = getSQLDateOnly(new Date());

    try {
        const existingRecord = await ChamCong.findOne({
            where: {
                maNV: maNV,
                ngay: todayDateOnly,
                gioRa: null
            }
        });
        
        if (existingRecord) {
            // Đã check-in và chưa check-out
            res.json({ status: "checked-in", gioVao: existingRecord.gioVao });
        } else {
            // Chưa check-in (hoặc đã check-out)
            res.json({ status: "checked-out" });
        }
    } catch (error) {
         res.status(500).json({ message: "Lỗi: " + error.message });
    }
};

// ==========================================================
// ⭐ HÀM: XÓA MỘT MỤC CHẤM CÔNG (ADMIN)
// ==========================================================
exports.deleteAttendance = async (req, res) => {
    try {
        const id = req.params.id; // Lấy maCC từ URL
        const record = await ChamCong.findByPk(id);
        if (!record) {
            return res.status(404).json({ message: "Không tìm thấy mục chấm công" });
        }
        
        await record.destroy();
        res.json({ message: "Xóa mục chấm công thành công" });
    } catch (error) {
        console.error("Lỗi xóa chấm công:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// ==========================================================
// ⭐ HÀM: SỬA MỘT MỤC CHẤM CÔNG (ADMIN)
// ==========================================================
exports.updateAttendance = async (req, res) => {
    try {
        const id = req.params.id; // Lấy maCC từ URL
        const { gioVao, gioRa, trangThai } = req.body; // Dữ liệu admin muốn sửa
        
        const record = await ChamCong.findByPk(id);
        if (!record) {
            return res.status(404).json({ message: "Không tìm thấy mục chấm công" });
        }
        
        // Cập nhật các trường được phép
        if (gioVao) record.gioVao = gioVao;
        if (gioRa) record.gioRa = gioRa;
        if (trangThai) record.trangThai = trangThai;
        
        await record.save();
        res.json({ message: "Cập nhật chấm công thành công", record });
    } catch (error) {
        console.error("Lỗi cập nhật chấm công:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};