import { Router } from 'express';
import authRoutes from './auth.routes';
import accountRoutes from './account.routes';
import transactionRoutes from './transaction.routes';

const router = Router();

// ========================================
// Route Map
// ========================================
const routes: { path: string; router: Router }[] = [
    { path: '/auth', router: authRoutes },
    { path: '/accounts', router: accountRoutes },
    { path: '/transactions', router: transactionRoutes },
];

routes.forEach(({ path, router: r }) => {
    router.use(path, r);
});

export default router;
