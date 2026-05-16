import express from 'express';
import { addMember, getMembers, removeMember } from '../controllers/memberController.js';
import auth from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.post('/add', auth('Admin'), addMember);
router.post('/remove', auth('Admin'), removeMember);
router.get('/', auth(), getMembers);

export default router;
