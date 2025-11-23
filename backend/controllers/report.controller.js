const { sequelize, ChiTietDonHang, SanPham } = require("../models");
const { QueryTypes } = require("sequelize");

// ===================================================================
// 1) Doanh thu theo ngày / tháng / năm
// ===================================================================
exports.getRevenueByDate = async (req, res) => {
  try {
    const type = req.query.type || "date";
    let sql = "";
    const replacements = {};

    if (type === "date") {
      const from = req.query.from || null;
      const to = req.query.to || null;

      let where = "";

      if (from && to) {
        where = "WHERE CONVERT(date, thoiGian) BETWEEN :from AND :to";
        replacements.from = from;
        replacements.to = to;
      } else if (from) {
        where = "WHERE CONVERT(date, thoiGian) >= :from";
        replacements.from = from;
      } else if (to) {
        where = "WHERE CONVERT(date, thoiGian) <= :to";
        replacements.to = to;
      }

      sql = `
        SELECT
          CONVERT(varchar(10), thoiGian, 23) AS ngay,
          SUM(soTien) AS doanhThu
        FROM ThanhToan
        ${where}
        GROUP BY CONVERT(varchar(10), thoiGian, 23)
        ORDER BY ngay DESC
      `;
    }

    else if (type === "month") {
      const year = parseInt(req.query.year);
      const month = parseInt(req.query.month);

      if (!year || !month) {
        return res.status(400).json({ message: "Thiếu year hoặc month" });
      }

      replacements.year = year;
      replacements.month = month;

      sql = `
        SELECT
          CONCAT(:year, '-', RIGHT('0' + CAST(:month AS VARCHAR), 2)) AS thang,
          SUM(soTien) AS doanhThu
        FROM ThanhToan
        WHERE YEAR(thoiGian) = :year AND MONTH(thoiGian) = :month
        GROUP BY YEAR(thoiGian), MONTH(thoiGian)
      `;
    }

    else if (type === "year") {
      const year = parseInt(req.query.year);
      if (!year) {
        return res.status(400).json({ message: "Thiếu year" });
      }

      replacements.year = year;

      sql = `
        SELECT
          YEAR(thoiGian) AS nam,
          SUM(soTien) AS doanhThu
        FROM ThanhToan
        WHERE YEAR(thoiGian) = :year
        GROUP BY YEAR(thoiGian)
      `;
    }

    const rows = await sequelize.query(sql, {
      type: QueryTypes.SELECT,
      replacements,
    });

    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi tạo báo cáo doanh thu", error: err.message });
  }
};

// ===================================================================
// 2) Sản phẩm bán chạy
// ===================================================================
// exports.getTopProducts cũ ... sửa thành:

exports.getTopProducts = async (req, res) => {
  try {
    const top = parseInt(req.query.top) || 10;
    const from = req.query.from;
    const to = req.query.to;

    let dateFilter = "";
    const replacements = { top };

    if (from && to) {
      // SỬA LỖI TẠI ĐÂY: Đổi dh.ngayTao thành dh.thoiGian
      dateFilter = "WHERE CONVERT(date, dh.thoiGian) BETWEEN :from AND :to";
      replacements.from = from;
      replacements.to = to;
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