import express from 'express';
import {
    createTask,
    deleteTask,
    getTasks,
    updateTask
} from '../controllers/taskController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth(), getTasks);
router.post('/', auth('Admin'), createTask);
router.put('/:id', auth(['Admin', 'Member']), updateTask);
router.delete('/:id', auth('Admin'), deleteTask);

export default router;
