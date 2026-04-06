import { registerSchema, loginSchema } from '@/validators/auth.validator';

describe('registerSchema', () => {
    const validData = {
        email: 'test@example.com',
        password: 'Password123',
        fullName: 'Test User',
    };

    it('ผ่านถ้าข้อมูลถูกต้อง', () => {
        const result = registerSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    it('fail ถ้า email ไม่ใช่รูปแบบที่ถูกต้อง', () => {
        const result = registerSchema.safeParse({ ...validData, email: 'not-an-email' });
        expect(result.success).toBe(false);
    });

    it('fail ถ้า password สั้นกว่า 8 ตัว', () => {
        const result = registerSchema.safeParse({ ...validData, password: 'Ab123' });
        expect(result.success).toBe(false);
    });

    it('fail ถ้า password ไม่มีตัวพิมพ์ใหญ่', () => {
        const result = registerSchema.safeParse({ ...validData, password: 'password123' });
        expect(result.success).toBe(false);
    });

    it('fail ถ้า password ไม่มีตัวเลข', () => {
        const result = registerSchema.safeParse({ ...validData, password: 'PasswordABC' });
        expect(result.success).toBe(false);
    });

    it('fail ถ้า fullName สั้นกว่า 2 ตัว', () => {
        const result = registerSchema.safeParse({ ...validData, fullName: 'A' });
        expect(result.success).toBe(false);
    });
});

describe('loginSchema', () => {
    it('ผ่านถ้า email + password ครบ', () => {
        const result = loginSchema.safeParse({
            email: 'test@example.com',
            password: 'anything',
        });
        expect(result.success).toBe(true);
    });

    it('fail ถ้า email ว่าง', () => {
        const result = loginSchema.safeParse({
            email: '',
            password: 'anything',
        });
        expect(result.success).toBe(false);
    });

    it('fail ถ้า password ว่าง', () => {
        const result = loginSchema.safeParse({
            email: 'test@example.com',
            password: '',
        });
        expect(result.success).toBe(false);
    });
});
