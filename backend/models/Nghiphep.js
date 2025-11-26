// models/Nghiphep.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); 

const NghiPhep = sequelize.define("NghiPhep", {
    maNP: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    maNV: {
        type: DataTypes.INTEGER
    },
    loaiPhep: {
        type: DataTypes.STRING
    },
    tuNgay: {
        type: DataTypes.DATE
    },
    denNgay: {
        type: DataTypes.DATE
    },
    lyDo: {
        type: DataTypes.STRING
    },
    trangThai: {
        type: DataTypes.STRING,
        defaultValue: 'ChoDuyet'
    }
}, {
    tableName: 'NghiPhep', // Tên bảng trong SQL
    timestamps: false // Không tự động thêm createdAt/updatedAt
});

module.exports = NghiPhep;