import { AuthController } from "@/controllers/auth.controller";
import { UserRepository } from "@/repositories/user.repository";
import { AuthService } from "@/services/auth.service";
import { validate } from "@/middlewares/validator.middleware";
import { loginSchema, registerSchema } from "@/validators/auth.validator";
import { Router } from "express";

const router = Router();

const userRepo = new UserRepository();
const authService = new AuthService(userRepo);
const authController = new AuthController(authService);

/**
 * @openapi
 * tags:
 *   - name: Authentication
 *     description: Register, login, และจัดการ session
 */

/**
 * @openapi
 * /auth/health:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Auth service health check
 *     description: เช็คว่า auth service ทำงานปกติมั้ย
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
router.get('/health', authController.health);

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: |
 *       สร้าง user account ใหม่ จะได้ role `customer` อัตโนมัติ
 *
 *       **Validation:**
 *       - email ต้องเป็นรูปแบบที่ถูกต้อง
 *       - password อย่างน้อย 8 ตัว มีตัวพิมพ์ใหญ่ + ตัวเลข
 *       - fullName อย่างน้อย 2 ตัว ไม่เกิน 100 ตัว
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123
 *               fullName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: John Doe
 *               phoneNumber:
 *                 type: string
 *                 example: "0812345678"
 *               nationalId:
 *                 type: string
 *                 example: "1234567890123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login with email and password
 *     description: |
 *       Login เพื่อรับ JWT tokens
 *
 *       **Account lockout:**
 *       - login ผิด 5 ครั้ง → account lock 30 นาที
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: customer@bankapp.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Validation error (missing email/password)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       423:
 *         description: Account locked due to too many failed attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', validate(loginSchema), authController.login);

export default router;
