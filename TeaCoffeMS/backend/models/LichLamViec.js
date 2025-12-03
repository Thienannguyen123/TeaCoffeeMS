// models/LichLamViec.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); 

const LichLamViec = sequelize.define("LichLamViec", {
    maLich: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    maNV: {
        type: DataTypes.INTEGER
    },
    ngayLamViec: {
        type: DataTypes.DATEONLY // Chỉ lưu ngày
    },
    tenCa: {
        type: DataTypes.STRING
    },
    gioBatDau: {
        type: DataTypes.TIME // Chỉ lưu giờ
    },
    gioKetThuc: {
        type: DataTypes.TIME // Chỉ lưu giờ
    }
}, {
    tableName: 'LichLamViec',
    timestamps: false
});

module.exports = LichLamViec;