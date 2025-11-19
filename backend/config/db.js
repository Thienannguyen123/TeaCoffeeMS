// config/db.js
// Kết nối Sequelize -> SQL Server 2014

const { Sequelize } = require("sequelize");
require("dotenv").config();

const DB_NAME = process.env.DB_NAME || "TeaCoffeeMS";
const DB_USER = process.env.DB_USER || "teacoffee_user";
const DB_PASS = process.env.DB_PASS || "123456";
const DB_HOST = process.env.DB_HOST || "192.168.1.5";
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 1433;
const DB_INSTANCE = process.env.DB_INSTANCE || undefined;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "mssql",
  dialectOptions: {
    options: {
      encrypt: false,
      trustServerCertificate: true,
    }
  },
  pool: { max: 5, min: 0, idle: 10000, acquire: 30000 },
  logging: process.env.DB_LOGGING === "true"
});

// Test connection
sequelize
  .authenticate()
  .then(() => console.log("✅ Kết nối SQL Server thành công"))
  .catch((err) => console.error("❌ Lỗi kết nối SQL Server:", err.message));

module.exports = sequelize;
