// Stub สำหรับ uuid package ใน Jest
// uuid v13 เป็น pure ESM → Jest run ไม่ได้
// ใช้ node:crypto.randomUUID() แทน (built-in, ไม่ต้องลงอะไร)
import { randomUUID } from 'crypto';

export const v4 = (): string => randomUUID();
export const v1 = (): string => randomUUID();
export const v3 = (): string => randomUUID();
export const v5 = (): string => randomUUID();
export const v6 = (): string => randomUUID();
export const v7 = (): string => randomUUID();

export const validate = (uuid: string): boolean =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);

export const NIL = '00000000-0000-0000-0000-000000000000';
export const MAX = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

export default { v4, v1, v3, v5, v6, v7, validate, NIL, MAX };
