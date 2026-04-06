-- =============================================
-- Seed 002: ข้อมูล accounts สำหรับ development
-- =============================================
-- สร้าง account ให้ seed users ที่มีอยู่แล้ว

-- customer ได้ 2 accounts (savings + checking)
INSERT INTO accounts (user_id, account_number, account_type, balance, status)
SELECT id, 'ACC0000000001', 'savings', 50000.00, 'active'
FROM users WHERE email = 'customer@bankapp.com'
ON CONFLICT (account_number) DO NOTHING;

INSERT INTO accounts (user_id, account_number, account_type, balance, status)
SELECT id, 'ACC0000000002', 'checking', 150000.00, 'active'
FROM users WHERE email = 'customer@bankapp.com'
ON CONFLICT (account_number) DO NOTHING;

-- teller ได้ 1 savings account
INSERT INTO accounts (user_id, account_number, account_type, balance, status)
SELECT id, 'ACC0000000003', 'savings', 80000.00, 'active'
FROM users WHERE email = 'teller@bankapp.com'
ON CONFLICT (account_number) DO NOTHING;

-- admin ได้ 1 business account
INSERT INTO accounts (user_id, account_number, account_type, balance, status)
SELECT id, 'ACC0000000004', 'business', 1000000.00, 'active'
FROM users WHERE email = 'admin@bankapp.com'
ON CONFLICT (account_number) DO NOTHING;