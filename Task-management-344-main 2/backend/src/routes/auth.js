import express from 'express';
import { changePassword, getMe, inviteTeamMember, listUsers, login, signup, updateMe, getTeamMembers, removeTeamMember } from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', auth(), getMe);
router.patch('/me', auth(), updateMe);
router.patch('/me/password', auth(), changePassword);
router.get('/users', auth(), listUsers);
router.post('/team-members/invite', auth(), inviteTeamMember);
router.get('/team-members', auth(), getTeamMembers);
router.delete('/team-members/:id', auth(), removeTeamMember);

export default router;
