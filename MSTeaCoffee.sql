-- Bảng nhân viên
CREATE TABLE NhanVien (
    maNV INT PRIMARY KEY,
    tenNV NVARCHAR(100) NOT NULL,
    taiKhoan NVARCHAR(50) UNIQUE NOT NULL,
    matKhau NVARCHAR(100) NOT NULL,
    vaiTro NVARCHAR(20) NOT NULL 
        CHECK (vaiTro IN ('NhanVien','QuanLy')) DEFAULT 'NhanVien',
    caLamViec NVARCHAR(50)
);

-- Bảng bàn
CREATE TABLE Ban (
    maBan INT PRIMARY KEY,
    tenBan NVARCHAR(50),
    trangThai NVARCHAR(20) NOT NULL 
        CHECK (trangThai IN ('Trong','DangPhucVu','DaDatTruoc')) DEFAULT 'Trong'
);

-- Bảng sản phẩm
CREATE TABLE SanPham (
    maSP INT PRIMARY KEY,
    tenSP NVARCHAR(100) NOT NULL,
    gia DECIMAL(10,2) NOT NULL,
    loai NVARCHAR(20) NOT NULL 
        CHECK (loai IN ('DoUong','ThucAn'))
);

-- Bảng đơn hàng
CREATE TABLE DonHang (
    maDH INT PRIMARY KEY,
    maNV INT,
    maBan INT,
    tongTien DECIMAL(10,2) DEFAULT 0,
    trangThai NVARCHAR(20) NOT NULL 
        CHECK (trangThai IN ('DangXuLy','DaThanhToan','Huy')) DEFAULT 'DangXuLy',
    thoiGian DATETIME2 DEFAULT SYSUTCDATETIME(),
    FOREIGN KEY (maNV) REFERENCES NhanVien(maNV),
    FOREIGN KEY (maBan) REFERENCES Ban(maBan)
);

-- Bảng chi tiết đơn hàng
CREATE TABLE ChiTietDonHang (
    maDH INT,
    maSP INT,
    soLuong INT NOT NULL,
    ghiChu NVARCHAR(200),
    PRIMARY KEY (maDH, maSP),
    FOREIGN KEY (maDH) REFERENCES DonHang(maDH),
    FOREIGN KEY (maSP) REFERENCES SanPham(maSP)
);

-- Bảng thanh toán
CREATE TABLE ThanhToan (
    maTT INT PRIMARY KEY,
    maDH INT UNIQUE,
    soTien DECIMAL(10,2) NOT NULL,
    phuongThuc NVARCHAR(20) NOT NULL 
        CHECK (phuongThuc IN ('TienMat','The','ChuyenKhoan')),
    thoiGian DATETIME2 DEFAULT SYSUTCDATETIME(),
    FOREIGN KEY (maDH) REFERENCES DonHang(maDH)
);

-- Bảng báo cáo
CREATE TABLE BaoCao (
    maBC INT PRIMARY KEY,
    ngay DATE,
    tongDoanhThu DECIMAL(12,2),
    tongLoiNhuan DECIMAL(12,2),
    sanPhamBanChay NVARCHAR(100)
);


ALTER TABLE ChiTietDonHang
ADD maCTDH INT IDENTITY(1,1);

ALTER TABLE NhanVien
ADD createdAt DATETIME NULL,
    updatedAt DATETIME NULL;
-- 1. Bảng NhanVien
-- Dữ liệu từ ảnh z7167267380950_b3f6de36a36e5801ead9e7900bb9c0d6.jpg
INSERT INTO NhanVien (maNV, tenNV, taiKhoan, matKhau, vaiTro, caLamViec, createdAt, updatedAt)
VALUES
(1, N'Nguyễn Văn...', 'admin', '123456', N'QuanLy', N'Ca sáng', '2025-10-08', '2025-10-08'),
(2, N'Lê Thị B', 'nhanvien1', '123456', N'NhanVien', N'Ca chiều', '2025-10-08', '2025-10-08'),
(4, N'Nguyễn Văn...', 'nhanvien3', '$2a$10$Okr...', N'NhanVien', N'Ca sáng', '2025-10-08', '2025-10-08'),
(5, N'Nguyễn H', 'nhanvien123', '$2a$10$sh3...', N'NhanVien', N'Ca sáng', '2025-10-15', '2025-10-15');

-- 2. Bảng Ban
-- Dữ liệu từ ảnh z7167267306373_229caa56b945542aa52888a5f71dc40f.jpg
INSERT INTO Ban (maBan, tenBan, trangThai)
VALUES
(1, N'Bàn 1', N'DangPhucVu'),
(2, N'Bàn 2', N'Trong');

-- 3. Bảng SanPham
-- Dữ liệu từ ảnh z7167267306413_8a6e4591b8d08a37c9f7cfb23bff25f0.jpg
INSERT INTO SanPham (maSP, tenSP, gia, loai)
VALUES
(1, N'Cà phê sữa đá', 25000.00, N'DoUong'),
(2, N'Trà đào cam xả', 30000.00, N'DoUong'),
(3, N'Sinh tố bơ', 35000.00, N'DoUong');

-- 4. Bảng BaoCao
-- Dữ liệu từ ảnh z7167267306412_5afc4374d66855c2ff3a2cf553bc2f4e.jpg
-- (Lưu ý: maBC trong ảnh là 0)
INSERT INTO BaoCao (maBC, ngay, tongDoanhThu, tongLoiNhuan, sanPhamBanChay)
VALUES
(0, '2025-10-08', 55000.00, 20000.00, N'Trà sữa truyền thống');

-- 5. Bảng DonHang
-- Dữ liệu từ ảnh z7167267380951_6f17937cf2f1249994b881369c4f8a13.jpg
INSERT INTO DonHang (maDH, maNV, maBan, tongTien, trangThai, thoiGian)
VALUES
(1, 1, 1, 80000.00, N'DaThanhToan', '2025-10-15');

-- 6. Bảng ChiTietDonHang
-- Dữ liệu từ ảnh z7167267344017_0887f6529a941fb589f85bbf38d75c06.jpg
-- (Lưu ý: Bỏ qua cột maCTDH vì đây là cột tự động tăng IDENTITY)
INSERT INTO ChiTietDonHang (maDH, maSP, soLuong, ghiChu)
VALUES
(1, 2, 1, NULL);
-- (Dựa trên tổng tiền 80000, chúng tôi suy đoán có thêm món này)
INSERT INTO ChiTietDonHang (maDH, maSP, soLuong, ghiChu)
VALUES
(1, 1, 2, NULL); -- (1*30000 + 2*25000 = 80000)

-- 7. Bảng ThanhToan
-- Dữ liệu từ ảnh z7167267380948_9438963f5bbd2dbcc3020915ad3553ef.jpg
-- (Bảng này không có dữ liệu)
-- INSERT INTO ThanhToan (maTT, maDH, soTien, phuongThuc, thoiGian) VALUES (...);

CREATE TABLE NghiPhep (
    maNP INT IDENTITY(1,1) PRIMARY KEY, -- Mã nghỉ phép, tự động tăng
    maNV INT, -- Mã nhân viên xin nghỉ
    loaiPhep NVARCHAR(50), -- 'Nghỉ ốm', 'Nghỉ cá nhân'...
    tuNgay DATE,
    denNgay DATE,
    lyDo NVARCHAR(255),
    trangThai NVARCHAR(20) DEFAULT 'ChoDuyet' -- 'ChoDuyet', 'DaDuyet', 'TuChoi'
    
    -- Tạo khóa ngoại liên kết với bảng NhanVien
    FOREIGN KEY (maNV) REFERENCES NhanVien(maNV)
);

INSERT INTO NghiPhep (maNV, loaiPhep, tuNgay, denNgay, lyDo, trangThai)
VALUES (
    2, 
    N'Nghỉ ốm', 
    '2025-11-05', 
    '2025-11-06', 
    N'Bị cảm cúm, cần nghỉ ngơi 2 ngày', 
    'ChoDuyet'
);

CREATE TABLE ChamCong (
    maCC INT IDENTITY(1,1) PRIMARY KEY, -- Mã chấm công (tự tăng)
    maNV INT,
    ngay DATE,
    gioVao DATETIME,
    gioRa DATETIME NULL, -- Cho phép NULL (vì nhân viên có thể chưa check-out)
    trangThai NVARCHAR(20) DEFAULT N'Đúng giờ',
    
    FOREIGN KEY (maNV) REFERENCES NhanVien(maNV)
);


INSERT INTO ChamCong (maNV, ngay, gioVao, gioRa, trangThai)
VALUES 
(2, '2025-11-04', '2025-11-04 08:00:00', '2025-11-04 17:00:00', N'Đúng giờ'),
(4, '2025-11-04', '2025-11-04 08:30:00', NULL, N'Đi trễ');

ALTER TABLE ChiTietDonHang DROP COLUMN maCTDH;

ALTER TABLE ChiTietDonHang ADD maCTDH INT;

ALTER TABLE ChiTietDonHang ADD PRIMARY KEY (maCTDH);

CREATE TABLE LichLamViec (
    maLich INT IDENTITY(1,1) PRIMARY KEY,
    maNV INT,
    ngayLamViec DATE NOT NULL,
    tenCa NVARCHAR(50) NOT NULL, -- (Vi du: 'Ca Sáng', 'Ca Tối')
    gioBatDau TIME,
    gioKetThuc TIME,
    
    FOREIGN KEY (maNV) REFERENCES NhanVien(maNV)
);

INSERT INTO LichLamViec (maNV, ngayLamViec, tenCa, gioBatDau, gioKetThuc)
VALUES
(2, '2025-11-05', N'Ca Sáng', '07:00:00', '12:00:00'),
(4, '2025-11-05', N'Ca Chiều', '12:00:00', '18:00:00'),
(5, '2025-11-05', N'Ca Tối', '18:00:00', '23:00:00'),
(2, '2025-11-06', N'Ca Sáng', '07:00:00', '12:00:00');