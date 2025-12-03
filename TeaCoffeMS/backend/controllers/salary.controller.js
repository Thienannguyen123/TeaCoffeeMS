const { sequelize } = require("../models");
const { QueryTypes } = require("sequelize");

exports.getSalaryReport = async (req, res) => {
    try {
        const month = parseInt(req.query.month);
        const year = parseInt(req.query.year);

        if (!month || !year) {
            return res.status(400).json({ message: "Vui lòng chọn tháng và năm" });
        }

        // 1. Lấy dữ liệu Chấm công + Lịch làm việc + Nhân viên
        // Join 3 bảng để có đủ thông tin: Giờ vào thực tế, Giờ bắt đầu ca (để tính trễ), Giờ kết thúc ca (để tính OT)
        const sql = `
            SELECT 
                nv.maNV, nv.tenNV, nv.vaiTro,
                cc.ngay, cc.gioVao, cc.gioRa,
                llv.gioBatDau AS caBatDau, 
                llv.gioKetThuc AS caKetThuc
            FROM NhanVien nv
            JOIN ChamCong cc ON nv.maNV = cc.maNV
            LEFT JOIN LichLamViec llv ON cc.maNV = llv.maNV AND cc.ngay = llv.ngayLamViec
            WHERE MONTH(cc.ngay) = :month 
              AND YEAR(cc.ngay) = :year
              AND cc.gioRa IS NOT NULL -- Chỉ tính khi đã check-out
            ORDER BY nv.maNV, cc.ngay
        `;

        const records = await sequelize.query(sql, {
            replacements: { month, year },
            type: QueryTypes.SELECT
        });

        // 2. Tính toán lương cho từng nhân viên
        const salaryData = {};

        records.forEach(row => {
            if (!salaryData[row.maNV]) {
                salaryData[row.maNV] = {
                    maNV: row.maNV,
                    tenNV: row.tenNV,
                    vaiTro: row.vaiTro,
                    tongGioLam: 0,
                    tongGioTangCa: 0,
                    tongTienLuong: 0,
                    tongPhat: 0,
                    chiTiet: [] // Để debug hoặc xem chi tiết nếu cần
                };
            }

            // --- A. Tính giờ làm việc ---
            const vao = new Date(row.gioVao);
            const ra = new Date(row.gioRa);
            
            // Tổng giờ làm thực tế (Hours)
            const totalHours = (ra - vao) / (1000 * 60 * 60);
            
            // Xác định giờ tiêu chuẩn của ca (nếu có lịch)
            let standardHours = 0;
            let caBatDauDate = null;

            if (row.caBatDau && row.caKetThuc) {
                // Tạo Date object cho lịch để tính toán
                const startShift = new Date(row.ngay);
                const [h1, m1] = row.caBatDau.split(':'); // Giả sử format HH:mm:ss
                startShift.setHours(h1, m1, 0);
                caBatDauDate = startShift;

                const endShift = new Date(row.ngay);
                const [h2, m2] = row.caKetThuc.split(':');
                endShift.setHours(h2, m2, 0);

                standardHours = (endShift - startShift) / (1000 * 60 * 60);
            } else {
                // Nếu không có lịch (làm ngoài giờ/thay ca), coi tất cả là giờ thường hoặc mặc định 4h/ca tuỳ logic
                // Ở đây ta tạm tính: Nếu không có lịch, toàn bộ là giờ thường (27k)
                standardHours = totalHours; 
                caBatDauDate = vao; // Coi như vào đúng giờ
            }

            // --- B. Phân loại Giờ thường vs Tăng ca ---
            let hoursNormal = 0;
            let hoursOT = 0;

            if (totalHours > standardHours) {
                hoursNormal = standardHours;
                hoursOT = totalHours - standardHours;
            } else {
                hoursNormal = totalHours;
                hoursOT = 0;
            }

            // --- C. Tính tiền ngày hôm đó (Chưa phạt) ---
            const RATE_NORMAL = 27000;
            const RATE_OT = 25000; // Theo yêu cầu của bạn (thường OT cao hơn, nhưng code theo yêu cầu)

            let dailyWage = (hoursNormal * RATE_NORMAL) + (hoursOT * RATE_OT);

            // --- D. Tính phạt đi trễ ---
            let penalty = 0;
            let minutesLate = 0;
            let ghiChuPhat = "";

            if (caBatDauDate && vao > caBatDauDate) {
                minutesLate = (vao - caBatDauDate) / (1000 * 60); // Phút trễ

                if (minutesLate > 0 && minutesLate < 30) {
                    // Trễ dưới 30p: Trừ 2% lương hôm đó
                    penalty = dailyWage * 0.02;
                    ghiChuPhat = `Trễ ${minutesLate.toFixed(0)}p (-2%)`;
                } else if (minutesLate >= 30) {
                    // Trễ >= 30p: Trừ 50% lương hôm đó
                    penalty = dailyWage * 0.50;
                    ghiChuPhat = `Trễ ${minutesLate.toFixed(0)}p (-50%)`;
                }
            }

            // Cộng dồn vào tổng
            salaryData[row.maNV].tongGioLam += hoursNormal;
            salaryData[row.maNV].tongGioTangCa += hoursOT;
            salaryData[row.maNV].tongTienLuong += (dailyWage - penalty);
            salaryData[row.maNV].tongPhat += penalty;
        });

        // Chuyển object thành array để trả về
        const result = Object.values(salaryData);
        res.json(result);

    } catch (error) {
        console.error("Lỗi tính lương:", error);
        res.status(500).json({ message: "Lỗi server khi tính lương" });
    }
};

exports.getMySalary = async (req, res) => {
    try {
        const userId = req.user.maNV; 

        console.log("Đang tính lương cho NV:", userId); // Log để kiểm tra

        const month = parseInt(req.query.month);
        const year = parseInt(req.query.year);

        if (!month || !year) {
            return res.status(400).json({ message: "Vui lòng chọn tháng và năm" });
        }

        // 1. Query SQL: Thêm điều kiện nv.maNV = :userId
        const sql = `
            SELECT 
                nv.maNV, nv.tenNV, nv.vaiTro,
                cc.ngay, cc.gioVao, cc.gioRa,
                llv.gioBatDau AS caBatDau, 
                llv.gioKetThuc AS caKetThuc
            FROM NhanVien nv
            JOIN ChamCong cc ON nv.maNV = cc.maNV
            LEFT JOIN LichLamViec llv ON cc.maNV = llv.maNV AND cc.ngay = llv.ngayLamViec
            WHERE MONTH(cc.ngay) = :month 
              AND YEAR(cc.ngay) = :year
              AND nv.maNV = :userId  -- <--- QUAN TRỌNG: Chỉ lấy dữ liệu của chính mình
              AND cc.gioRa IS NOT NULL
            ORDER BY cc.ngay
        `;

        const records = await sequelize.query(sql, {
            replacements: { month, year, userId },
            type: QueryTypes.SELECT
        });

        if (records.length === 0) {
            return res.json([]); // Trả về mảng rỗng nếu chưa có dữ liệu
        }

        // 2. Tính toán lương (Logic giữ nguyên như admin)
        // Vì chỉ có 1 nhân viên, ta khởi tạo object trực tiếp
        const mySalary = {
            maNV: records[0].maNV,
            tenNV: records[0].tenNV,
            vaiTro: records[0].vaiTro,
            tongGioLam: 0,
            tongGioTangCa: 0,
            tongTienLuong: 0,
            tongPhat: 0,
            chiTiet: [] 
        };

        records.forEach(row => {
            // --- A. Tính giờ làm việc ---
            const vao = new Date(row.gioVao);
            const ra = new Date(row.gioRa);
            const totalHours = (ra - vao) / (1000 * 60 * 60);
            
            let standardHours = 0;
            let caBatDauDate = null;

            if (row.caBatDau && row.caKetThuc) {
                const startShift = new Date(row.ngay);
                const [h1, m1] = row.caBatDau.split(':');
                startShift.setHours(h1, m1, 0);
                caBatDauDate = startShift;

                const endShift = new Date(row.ngay);
                const [h2, m2] = row.caKetThuc.split(':');
                endShift.setHours(h2, m2, 0);

                standardHours = (endShift - startShift) / (1000 * 60 * 60);
            } else {
                standardHours = totalHours; 
                caBatDauDate = vao; 
            }

            // --- B. Phân loại Giờ thường vs Tăng ca ---
            let hoursNormal = 0;
            let hoursOT = 0;

            if (totalHours > standardHours) {
                hoursNormal = standardHours;
                hoursOT = totalHours - standardHours;
            } else {
                hoursNormal = totalHours;
                hoursOT = 0;
            }

            // --- C. Tính tiền ---
            const RATE_NORMAL = 27000;
            const RATE_OT = 25000;
            let dailyWage = (hoursNormal * RATE_NORMAL) + (hoursOT * RATE_OT);

            // --- D. Tính phạt ---
            let penalty = 0;
            if (caBatDauDate && vao > caBatDauDate) {
                const minutesLate = (vao - caBatDauDate) / (1000 * 60);
                if (minutesLate > 0 && minutesLate < 30) penalty = dailyWage * 0.02;
                else if (minutesLate >= 30) penalty = dailyWage * 0.50;
            }

            // Cộng dồn
            mySalary.tongGioLam += hoursNormal;
            mySalary.tongGioTangCa += hoursOT;
            mySalary.tongTienLuong += (dailyWage - penalty);
            mySalary.tongPhat += penalty;
            
            // Thêm chi tiết từng ngày để nhân viên đối chiếu
            mySalary.chiTiet.push({
                ngay: row.ngay,
                vao: row.gioVao,
                ra: row.gioRa,
                luongNgay: dailyWage - penalty,
                phat: penalty
            });
        });

        // Trả về mảng chứa 1 object (để đồng nhất format với frontend nếu cần)
        res.json([mySalary]);

    } catch (error) {
        console.error("Lỗi xem lương cá nhân:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};