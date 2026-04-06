-- =============================================
-- Seed 001: ข้อมูล users สำหรับ development
-- =============================================
-- password ทั้งหมดคือ "Password123!" (hashed ด้วย bcrypt 12 rounds)
-- ใช้สำหรับ dev เท่านั้น อย่าใช้ใน production!

INSERT INTO users (email, password_hash, full_name, phone_number, role, status)
VALUES
    (
        'admin@bankapp.com',
        '$2b$12$03H9wpttlZPqNZz4l.9U/ufH18FOk2sNR16ksTR7b0AMF0MYTHylu',
        'System Admin',
        '0800000001',
        'admin',
        'active'
    ),
    (
        'teller@bankapp.com',
        '$2b$12$03H9wpttlZPqNZz4l.9U/ufH18FOk2sNR16ksTR7b0AMF0MYTHylu',
        'Bank Teller',
        '0800000002',
        'teller',
        'active'
    ),
    (
        'customer@bankapp.com',
        '$2b$12$03H9wpttlZPqNZz4l.9U/ufH18FOk2sNR16ksTR7b0AMF0MYTHylu',
        'Test Customer',
        '0800000003',
        'customer',
        'active'
    )
ON CONFLICT (email) DO NOTHING;
-- ON CONFLICT → ถ้า email ซ้ำก็ไม่ error ข้ามไปเฉยๆ
-- ทำให้รัน seed ซ้ำกี่ทีก็ไม่พัง