import express from 'express';
import { uploadFile } from '../controllers/uploadController.js';
import auth from '../middleware/auth.js';
import { upload } from '../utils/fileUpload.js';

const router = express.Router();

router.post('/', auth(), upload.single('file'), uploadFile);

export default router;
