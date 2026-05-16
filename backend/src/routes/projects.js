import express from 'express';
import {
    createProject,
    deleteProject,
    getProjects,
    updateProject
} from '../controllers/projectController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth(), getProjects);
router.post('/', auth('Admin'), createProject);
router.put('/:id', auth('Admin'), updateProject);
router.delete('/:id', auth('Admin'), deleteProject);

export default router;
