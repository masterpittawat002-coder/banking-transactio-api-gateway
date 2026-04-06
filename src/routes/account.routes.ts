import { Router } from 'express';
import { AccountRepository } from '@repositories/account.repository';
import { AccountService } from '@services/account.service';
import { AccountController } from '@controllers/account.controller';
import { authMiddleware } from '@middlewares/auth.middleware';
import { validate } from '@middlewares/validator.middleware';
import { createAccountSchema } from '../validators/account.validator';

const router = Router();

// สร้าง instance chain
const accountRepository = new AccountRepository();
const accountService = new AccountService(accountRepository);
const accountController = new AccountController(accountService);

// ทุก route ต้อง login ก่อน
router.use(authMiddleware);

/**
 * @openapi
 * tags:
 *   - name: Accounts
 *     description: จัดการบัญชีธนาคาร — ต้อง login ก่อนทุก endpoint
 */

/**
 * @openapi
 * /accounts:
 *   post:
 *     tags:
 *       - Accounts
 *     summary: Create a new bank account
 *     description: |
 *       สร้างบัญชีใหม่ให้ user ที่ login อยู่
 *
 *       **Minimum balance ตาม account type:**
 *       - savings: 500 THB
 *       - checking: 1,000 THB
 *       - business: 5,000 THB
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountType
 *               - initialDeposit
 *             properties:
 *               accountType:
 *                 type: string
 *                 enum: [savings, checking, business]
 *                 example: savings
 *               initialDeposit:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 example: 1000.00
 *               currency:
 *                 type: string
 *                 default: THB
 *                 example: THB
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Account'
 *       400:
 *         description: Validation error or insufficient initial deposit
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', validate(createAccountSchema), accountController.create);

/**
 * @openapi
 * /accounts:
 *   get:
 *     tags:
 *       - Accounts
 *     summary: List all accounts of the current user
 *     description: ดูบัญชีทั้งหมดของ user ที่ login อยู่
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's accounts
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Account'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', accountController.list);

/**
 * @openapi
 * /accounts/{id}:
 *   get:
 *     tags:
 *       - Accounts
 *     summary: Get account details by ID
 *     description: |
 *       ดูรายละเอียดบัญชีตาม ID
 *
 *       **Authorization:** user เห็นได้แค่บัญชีของตัวเอง — ถ้าพยายามเข้า account ของคนอื่น → 403
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Account UUID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Account details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Account'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (account belongs to another user)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', accountController.getById);

export default router;
