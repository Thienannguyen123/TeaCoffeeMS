const { sequelize, ChiTietDonHang, SanPham } = require("../models");
const { QueryTypes } = require("sequelize");

// ===================================================================
// 1) Doanh thu theo ngày / tháng / năm (ĐÃ FIX LỖI TIME)
// ===================================================================
// ===================================================================
// 1) Doanh thu theo ngày (SỬA ĐỔI: LẤY TRỰC TIẾP TỪ ĐƠN HÀNG)
// ===================================================================
exports.getRevenueByDate = async (req, res) => {
  try {
    const type = req.query.type || "date";
    let sql = "";
    const replacements = {};

    // --- CẤU HÌNH TRẠNG THÁI ---
    // Dựa vào ảnh bạn gửi, trạng thái là "Đã thanh toán"
    // Nếu trong Database lưu tiếng Anh hay số (ví dụ: 1, 'Completed'), bạn hãy sửa lại dòng này cho khớp.
    const trangThaiCanLay = "DaThanhToan"; 

    if (type === "date") {
      let from = req.query.from; // YYYY-MM-DD
      let to = req.query.to;     // YYYY-MM-DD

      // Mặc định truy vấn từ bảng DonHang
      let where = "WHERE trangThai = :trangThai";
      replacements.trangThai = trangThaiCanLay;

      if (from) {
        where += " AND thoiGian >= :from";
        replacements.from = from + " 00:00:00"; // Bắt đầu ngày
      }

      if (to) {
        where += " AND thoiGian <= :to";
        replacements.to = to + " 23:59:59.999"; // Kết thúc ngày
      }

      // 🔥 QUAN TRỌNG: Query từ DonHang thay vì ThanhToan
      // Giả sử cột tổng tiền là 'tongTien'. Nếu DB của bạn là 'totalPrice' hay 'soTien', hãy sửa lại tên cột này.
      sql = `
        SELECT 
            CAST(thoiGian AS DATE) AS ngay,
            SUM(tongTien) AS doanhThu 
        FROM DonHang
        ${where}
        GROUP BY CAST(thoiGian AS DATE)
        ORDER BY ngay DESC
      `;
    }

    else if (type === "month") {
      const year = parseInt(req.query.year);
      const month = parseInt(req.query.month);

      if (!year || !month) return res.status(400).json({ message: "Thiếu year/month" });

      replacements.year = year;
      replacements.month = month;
      replacements.trangThai = trangThaiCanLay;

      sql = `
        SELECT
          YEAR(thoiGian) AS nam,
          MONTH(thoiGian) AS thang,
          SUM(tongTien) AS doanhThu
        FROM DonHang
        WHERE YEAR(thoiGian) = :year 
          AND MONTH(thoiGian) = :month 
          AND trangThai = :trangThai
        GROUP BY YEAR(thoiGian), MONTH(thoiGian)
      `;
    }

    else if (type === "year") {
        // ... Tương tự cho type year nếu cần ...
         const year = parseInt(req.query.year);
         replacements.year = year;
         replacements.trangThai = trangThaiCanLay;
         sql = `SELECT YEAR(thoiGian) as nam, SUM(tongTien) as doanhThu FROM DonHang WHERE YEAR(thoiGian) = :year AND trangThai = :trangThai GROUP BY YEAR(thoiGian)`;
    }

    const rows = await sequelize.query(sql, {
      type: QueryTypes.SELECT,
      replacements
    });

    return res.json(rows);
  } catch (err) {
    console.error("Lỗi API Doanh thu:", err);
    return res.status(500).json({ message: "Lỗi báo cáo", error: err.message });
  }
};


// ===================================================================
// 2) Sản phẩm bán chạy (ĐÃ FIX LỖI TIME)
// ===================================================================
exports.getTopProducts = async (req, res) => {
  try {
    const top = parseInt(req.query.top) || 10;
    const from = req.query.from;
    const to = req.query.to;

    let dateFilter = "";
    const replacements = { top };

    if (from && to) {
      // 🔥 FIX TƯƠNG TỰ: Thêm giờ phút để lấy trọn vẹn dữ liệu
      // Bỏ CAST(... as Date) để so sánh chính xác DateTime
      dateFilter = "WHERE dh.thoiGian >= :from AND dh.thoiGian <= :to";
      
      replacements.from = from + " 00:00:00";
      replacements.to = to + " 23:59:59.999";
    }

    const sql = `
      SELECT TOP(:top) ctdh.maSP,
             SUM(ctdh.soLuong) AS soLuongBan,
             sp.tenSP, sp.gia, sp.loai
      FROM ChiTietDonHang AS ctdh
      JOIN DonHang AS dh ON ctdh.maDH = dh.maDH 
      LEFT JOIN SanPham AS sp ON ctdh.maSP = sp.maSP
      ${dateFilter}
      GROUP BY ctdh.maSP, sp.tenSP, sp.gia, sp.loai
      ORDER BY SUM(ctdh.soLuong) DESC;
    `;

    const rows = await sequelize.query(sql, {
      replacements: replacements,
      type: QueryTypes.SELECT
    });

    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi lấy sản phẩm bán chạy", error: err.message });
  }
};

exports.getRevenueComparison = async (req, res) => {
    try {
        // Mặc định lấy tháng/năm hiện tại nếu không truyền
        const currentMonth = parseInt(req.query.month) || new Date().getMonth() + 1;
        const currentYear = parseInt(req.query.year) || new Date().getFullYear();
        const trangThai = "DaThanhToan"; // Đảm bảo đúng trạng thái trong DB

        // 1. Tính toán tháng trước
        let prevMonth = currentMonth - 1;
        let prevYear = currentYear;
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear = currentYear - 1;
        }

        // 2. Query tính tổng tiền (Dùng COALESCE để trả về 0 nếu null)
        const sql = `
            SELECT COALESCE(SUM(tongTien), 0) as total 
            FROM DonHang 
            WHERE MONTH(thoiGian) = :m 
              AND YEAR(thoiGian) = :y 
              AND trangThai = :tt
        `;

        // Lấy doanh thu tháng này
        const [currResult] = await sequelize.query(sql, {
            replacements: { m: currentMonth, y: currentYear, tt: trangThai },
            type: QueryTypes.SELECT
        });

        // Lấy doanh thu tháng trước
        const [prevResult] = await sequelize.query(sql, {
            replacements: { m: prevMonth, y: prevYear, tt: trangThai },
            type: QueryTypes.SELECT
        });

        const revenueNow = parseInt(currResult.total);
        const revenuePrev = parseInt(prevResult.total);
        
        // 3. Tính phần trăm tăng trưởng
        let percent = 0;
        if (revenuePrev > 0) {
            percent = ((revenueNow - revenuePrev) / revenuePrev) * 100;
        } else if (revenueNow > 0) {
            percent = 100; // Tăng trưởng tuyệt đối từ 0
        }

        return res.json({
            month: currentMonth,
            year: currentYear,
            revenueNow,
            revenuePrev,
            diff: revenueNow - revenuePrev,
            percent: percent.toFixed(1) // Làm tròn 1 số thập phân
        });

    } catch (err) {
        console.error("Lỗi so sánh doanh thu:", err);
        return res.status(500).json({ message: "Lỗi server" });
    }
};