import express from 'express';
import { changePassword, getMe, listUsers, login, signup, updateMe } from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', auth(), getMe);
router.patch('/me', auth(), updateMe);
router.patch('/me/password', auth(), changePassword);
router.get('/users', auth(), listUsers);

export default router;
