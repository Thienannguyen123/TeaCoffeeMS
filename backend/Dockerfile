# Sử dụng Node.js LTS (hỗ trợ tốt cho SQL Server)
FROM node:18

# Đặt thư mục làm việc trong container
WORKDIR /app

# Copy file package.json và package-lock.json
COPY package*.json ./

# Cài dependencies
RUN npm install

# Copy toàn bộ project vào container
COPY . .

# Expose cổng 5000 cho backend
EXPOSE 5000

# Chạy server
CMD ["npm", "run", "dev"]
