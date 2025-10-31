import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '@middleware/auth.middleware';
import { auditarAutenticacion } from '@middleware/audit.middleware';
import { validate } from './dtos';
import { RegisterDTO, LoginDTO, RefreshTokenDTO, ForgotPasswordDTO, ResetPasswordDTO, ChangePasswordDTO, } from './dtos';
const router = Router();
router.post('/register', validate(RegisterDTO), auditarAutenticacion, authController.register.bind(authController));
router.post('/login', validate(LoginDTO), auditarAutenticacion, authController.login.bind(authController));
router.post('/refresh', validate(RefreshTokenDTO), authController.refresh.bind(authController));
router.post('/logout', authenticate, auditarAutenticacion, authController.logout.bind(authController));
router.get('/me', authenticate, authController.me.bind(authController));
router.post('/forgot-password', validate(ForgotPasswordDTO), authController.forgotPassword.bind(authController));
router.post('/reset-password', validate(ResetPasswordDTO), authController.resetPassword.bind(authController));
router.post('/change-password', authenticate, validate(ChangePasswordDTO), authController.changePassword.bind(authController));
export default router;
//# sourceMappingURL=auth.routes.js.map