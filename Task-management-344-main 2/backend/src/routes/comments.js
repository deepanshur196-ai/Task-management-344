import express from 'express';
import { addComment, getComments } from '../controllers/commentController.js';
import auth from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.post('/', auth(), addComment);
router.get('/', auth(), getComments);

export default router;
