import express from 'express';
import {
    createProject,
    deleteProject,
    getProjects,
    updateProject,
    addProjectFeedback,
} from '../controllers/projectController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth(), getProjects);
router.post('/', auth('Admin'), createProject);
router.put('/:id', auth('Admin'), updateProject);
router.post('/:id/feedback', auth(), addProjectFeedback);
router.delete('/:id', auth('Admin'), deleteProject);

export default router;
