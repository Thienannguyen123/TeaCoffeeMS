// models/ChamCong.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); 

const ChamCong = sequelize.define("ChamCong", {
    maCC: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    maNV: {
        type: DataTypes.INTEGER
    },
    ngay: {
        type: DataTypes.DATEONLY // SỬA: Chỉ lưu ngày
    },
    gioVao: {
        type: DataTypes.DATE // SỬA: Dùng DATE thay cho DATETIME
    },
    gioRa: {
        type: DataTypes.DATE, // SỬA: Dùng DATE thay cho DATETIME
        allowNull: true // Cho phép rỗng
    },
    trangThai: {
        type: DataTypes.STRING,
        defaultValue: 'Đúng giờ'
    }
}, {
    tableName: 'ChamCong',
    timestamps: false // Tắt tự động thêm createdAt/updatedAt
});

module.exports = ChamCong;