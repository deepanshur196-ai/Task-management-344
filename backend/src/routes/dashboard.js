import express from 'express';
import { adminDashboard, memberDashboard } from '../controllers/dashboardController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/admin', auth('Admin'), adminDashboard);
router.get('/member', auth('Member'), memberDashboard);

export default router;
